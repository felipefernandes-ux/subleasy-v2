// Exporta os anúncios do Subleasy atual (WordPress) no formato subleasy-import v1.
// Roda pelo Novamira (execute-php), sem a tag de abertura do PHP. Só lê: não grava nada no site.
// Formato: docs/importacao/formato-anuncios.md

global $wpdb;

$tz = wp_timezone();
$iso = function ($mysql) use ($tz) {
	if (!$mysql || $mysql === '0000-00-00 00:00:00') return null;
	return (new DateTime($mysql, $tz))->format('c');
};
$digits = fn($v) => preg_replace('/\D+/', '', (string) $v);
$phone = function ($v) use ($digits) {
	$d = $digits($v);
	if (strlen($d) > 11 && str_starts_with($d, '55')) $d = substr($d, 2);
	return $d ?: null;
};
$money = function ($v) {
	$v = trim((string) $v);
	if ($v === '') return null;
	$v = str_replace(['R$', ' ', '.'], '', $v);
	return round((float) str_replace(',', '.', $v), 2);
};
$num = fn($v) => ($v === '' || $v === null) ? null : (float) str_replace(',', '.', str_replace('.', '', (string) $v));
$key = fn($label) => trim(preg_replace('/[^a-z0-9]+/', '_', strtolower(remove_accents($label))), '_');

// Termos do WordPress para as chaves do 2.0 (src/lib/listing-options.ts).
$space_map = [
	'consultorio-medico' => 'consultorio_medico',
	'consultorio-odontologico' => 'odontologia',
	'sala-de-psicologia' => 'psicologia',
	'sala-de-estetica-e-bem-estar' => 'estetica',
	'espaco-terapeutico' => 'terapias',
	'sala-de-fisioterapia' => 'fisioterapia',
	'sala-de-nutricao' => 'nutricao',
	'sala-de-to-e-fonoaudiologia' => 'to_fono',
];
$amenity_map = [
	'Ar Condicionado' => 'ar_condicionado',
	'Wi-Fi' => 'wifi',
	'Estacionamento' => 'estacionamento',
	'Acessibilidade' => 'acessibilidade',
	'Limpeza' => 'limpeza_inclusa',
];
$billing_map = ['hora' => 'hora', 'turno' => 'turno', 'dia' => 'dia', 'mes' => 'mes', 'mês' => 'mes'];
// UF pelo CEP, quando o anúncio não tem a sigla do estado (faixas dos Correios).
$uf_by_cep = function ($cep) {
	$n = (int) substr(preg_replace('/\D+/', '', (string) $cep), 0, 5);
	if (!$n) return null;
	$ranges = [[1000,19999,'SP'],[20000,28999,'RJ'],[29000,29999,'ES'],[30000,39999,'MG'],[40000,48999,'BA'],[49000,49999,'SE'],[50000,56999,'PE'],[57000,57999,'AL'],[58000,58999,'PB'],[59000,59999,'RN'],[60000,63999,'CE'],[64000,64999,'PI'],[65000,65999,'MA'],[66000,68899,'PA'],[68900,68999,'AP'],[69000,69299,'AM'],[69300,69399,'RR'],[69400,69899,'AM'],[69900,69999,'AC'],[70000,72799,'DF'],[72800,72999,'GO'],[73000,73699,'DF'],[73700,76799,'GO'],[76800,76999,'RO'],[77000,77999,'TO'],[78000,78899,'MT'],[79000,79999,'MS'],[80000,87999,'PR'],[88000,89999,'SC'],[90000,99999,'RS']];
	foreach ($ranges as [$a, $b, $uf]) if ($n >= $a && $n <= $b) return $uf;
	return null;
};

$ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

$posts = $wpdb->get_results("SELECT * FROM {$wpdb->posts} WHERE post_type = 'anuncios' AND post_status IN ('publish','pending','draft','private','future','trash') ORDER BY ID");
$ids = array_map(fn($p) => (int) $p->ID, $posts);
$in = $ids ? implode(',', $ids) : '0';

// Visualizações: Post Views Counter (type 0 = dia AAAAMMDD, type 4 = total).
$views_daily = [];
foreach ($wpdb->get_results("SELECT id, period, count, visits FROM {$wpdb->prefix}post_views WHERE type = 0 AND id IN ($in) ORDER BY period") as $r) {
	$views_daily[(int) $r->id][] = [
		'date' => substr($r->period, 0, 4) . '-' . substr($r->period, 4, 2) . '-' . substr($r->period, 6, 2),
		'views' => (int) $r->count,
		'visits' => (int) $r->visits,
	];
}
$views_total = [];
foreach ($wpdb->get_results("SELECT id, count, visits FROM {$wpdb->prefix}post_views WHERE type = 4 AND id IN ($in)") as $r) {
	$views_total[(int) $r->id] = ['views' => (int) $r->count, 'visits' => (int) $r->visits];
}

$advertisers = [];
$listings = [];

foreach ($posts as $p) {
	$id = (int) $p->ID;
	$m = array_map(fn($v) => $v[0], get_post_meta($id));
	// Termos ligados ao post + os IDs que o formulário guarda em jet_tax__<taxonomia> (às vezes só eles existem).
	$terms = function ($tx) use ($id, $m) {
		$list = [];
		$raw = maybe_unserialize($m['jet_tax__' . $tx] ?? '');
		foreach ((array) $raw as $v) if (is_numeric($v) && ($t = get_term((int) $v, $tx)) instanceof WP_Term) $list[$t->term_id] = $t;
		foreach ((array) wp_get_object_terms($id, $tx) as $t) if ($t instanceof WP_Term) $list[$t->term_id] = $t;
		return array_values($list);
	};
	$term_name = function ($value, $tx) {
		$value = trim((string) $value);
		if ($value === '') return null;
		if (is_numeric($value)) { $t = get_term((int) $value, $tx); return $t instanceof WP_Term ? $t->name : null; }
		return $value;
	};
	$issues = [];

	// Anunciante: pelo e-mail de contato do anúncio; o autor só quando o e-mail não existe.
	$contact_email = strtolower(trim($m['email-do-usuario'] ?? ''));
	$user = $contact_email ? get_user_by('email', $contact_email) : false;
	if (!$user) $user = get_user_by('id', (int) $p->post_author);
	if ($user && in_array('administrator', (array) $user->roles, true) && $contact_email) $user = false;
	$adv_email = $user ? strtolower($user->user_email) : $contact_email;
	$adv_id = $user ? 'wp-user-' . $user->ID : 'wp-email-' . substr(md5($contact_email), 0, 12);
	if (!isset($advertisers[$adv_id])) {
		$name = $user ? trim(get_user_meta($user->ID, 'first_name', true) . ' ' . get_user_meta($user->ID, 'last_name', true)) : '';
		$advertisers[$adv_id] = [
			'source_id' => $adv_id,
			'name' => $name ?: ($user ? $user->display_name : null),
			'email' => $adv_email ?: null,
			'whatsapp' => $phone($m['celular-do-usuario'] ?? ($user ? get_user_meta($user->ID, 'billing_cellphone', true) : '')),
			'registered_at' => $user ? $iso($user->user_registered) : null,
			'wp_role' => $user ? (array_values((array) $user->roles)[0] ?? null) : null,
		];
	}

	// Status no vocabulário do 2.0.
	$views = $views_total[$id] ?? ['views' => 0, 'visits' => 0];
	$gap_days = (strtotime($p->post_modified) - strtotime($p->post_date)) / DAY_IN_SECONDS;
	$source_status = $p->post_status === 'trash' ? ($m['_wp_trash_meta_status'] ?? 'trash') . '>trash' : $p->post_status;
	if ($p->post_status === 'publish') $status = 'active';
	elseif ($p->post_status === 'pending') $status = 'pending_approval';
	elseif ($p->post_status === 'trash') $status = 'removed';
	elseif ($views['views'] > 0 || ($gap_days >= 29.5 && $gap_days <= 31.5)) $status = 'expired';
	else $status = 'draft';

	// Tipo de espaço.
	$types = $terms('tipo');
	$space = 'outro';
	foreach ($types as $t) if (isset($space_map[$t->slug])) { $space = $space_map[$t->slug]; break; }
	if (count($types) > 1) $issues[] = 'varios_tipos';
	if (!$types) $issues[] = 'sem_tipo';

	// Endereço: UF de 2 letras, cidade pelo termo "cidades" ou pelo campo do formulário.
	$uf = strtoupper((string) $term_name($m['jet_tax__estados'] ?? '', 'estados'));
	if (!in_array($uf, $ufs, true)) {
		$uf = null;
		foreach ($terms('estados') as $t) if (in_array(strtoupper($t->name), $ufs, true)) { $uf = strtoupper($t->name); break; }
	}
	$uf = $uf ?: $uf_by_cep($m['cep'] ?? '');
	$city_terms = $terms('cidades');
	$city = $term_name($m['jet_tax__cidades'] ?? '', 'cidades') ?: ($city_terms ? $city_terms[0]->name : (trim($m['cidade'] ?? '') ?: null));
	if (!$uf) $issues[] = 'sem_uf';
	if (!$city) $issues[] = 'sem_cidade';

	$amenities = [];
	foreach ($terms('comodidades') as $t) $amenities[] = $amenity_map[$t->name] ?? $key($t->name);

	$photos = array_values(array_filter(array_map('trim', explode(',', $m['galeria_de_imagens'] ?? ''))));
	if (!$photos) $issues[] = 'sem_foto';

	$title = html_entity_decode(trim($p->post_title), ENT_QUOTES, 'UTF-8');
	if ($title === '') $issues[] = 'sem_titulo';
	elseif (mb_strlen($title) > 70) $issues[] = 'titulo_longo';
	elseif (mb_strlen($title) < 10) $issues[] = 'titulo_curto';

	$price = $money($m['valor'] ?? '');
	if ($price === null || $price < 10) $issues[] = 'preco_invalido';
	$billing = $billing_map[strtolower(trim($m['tipo_de_aluguel'] ?? ''))] ?? null;
	if (!$billing) $issues[] = 'sem_cobranca';

	$description = trim(preg_replace("/\n{3,}/", "\n\n", wp_strip_all_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $p->post_content))));
	if ($description === '') $issues[] = 'sem_descricao';

	$clicks = [];
	foreach ($m as $k => $v) if (preg_match('/^wa_clicks_(\d{4})(\d{2})$/', $k, $mm)) $clicks[] = ['month' => "$mm[1]-$mm[2]", 'clicks' => (int) $v];
	usort($clicks, fn($a, $b) => strcmp($a['month'], $b['month']));

	$listings[] = [
		'source_id' => 'wp-' . $id,
		'source_url' => get_permalink($id),
		'advertiser_source_id' => $adv_id,
		'status' => $status,
		'source_status' => $source_status,
		'title' => $title,
		'description' => html_entity_decode($description, ENT_QUOTES, 'UTF-8'),
		'space_type' => $space,
		'space_type_labels' => array_map(fn($t) => $t->name, $types),
		'billing_type' => $billing,
		'price' => $price,
		'address' => [
			'zip_code' => ($z = $digits($m['cep'] ?? '')) ? substr($z, 0, 5) . '-' . substr($z, 5, 3) : null,
			'street' => trim($m['endereco'] ?? '') ?: null,
			'number' => trim($m['numero'] ?? '') ?: null,
			'complement' => trim($m['complemento'] ?? '') ?: null,
			'neighborhood' => trim($m['bairro'] ?? '') ?: null,
			'city' => $city,
			'state' => $uf,
		],
		'amenities' => array_values(array_unique($amenities)),
		'photos' => $photos,
		'contact' => [
			'whatsapp' => $phone($m['celular-do-usuario'] ?? ''),
			'email' => $contact_email ?: null,
		],
		'extras' => [
			'area_total_m2' => $num($m['area_total'] ?? ''),
			'area_util_m2' => $num($m['area_util'] ?? ''),
			'capacity' => ($m['capacidade'] ?? '') === '' ? null : (int) $m['capacidade'],
			'bathrooms' => ($m['banheiros'] ?? '') === '' ? null : (int) $m['banheiros'],
			'parking_spots' => ($m['vagas_de_garagem'] ?? '') === '' ? null : (int) $m['vagas_de_garagem'],
			'condo_fee' => $money($m['condominio'] ?? ''),
			'iptu' => $money($m['iptu'] ?? ''),
			'space_type_other' => trim($m['tipo_de_espaco_outro'] ?? '') ?: null,
			'audience' => array_map(fn($t) => $t->name, $terms('publico')),
			'periods' => array_map(fn($t) => $t->name, $terms('periodos')),
			'resources' => array_map(fn($t) => $t->name, $terms('recursos')),
		],
		'dates' => [
			'created_at' => $iso($p->post_date),
			'published_at' => in_array($status, ['active', 'expired'], true) || $source_status === 'publish>trash' ? $iso($p->post_date) : null,
			'updated_at' => $iso($p->post_modified),
			'removed_at' => isset($m['_wp_trash_meta_time']) ? wp_date('c', (int) $m['_wp_trash_meta_time']) : null,
		],
		'metrics' => [
			'views_total' => $views['views'],
			'visits_total' => $views['visits'],
			'whatsapp_clicks_total' => (int) ($m['wa_clicks_total'] ?? 0),
			'views_daily' => $views_daily[$id] ?? [],
			'whatsapp_clicks_monthly' => $clicks,
		],
		'seo' => [
			'slug' => $p->post_name ? urldecode($p->post_name) : null,
			'meta_description' => $m['rank_math_description'] ?? null,
		],
		'issues' => $issues,
	];
}

$by_status = [];
foreach ($listings as $l) $by_status[$l['status']] = ($by_status[$l['status']] ?? 0) + 1;

return [
	'format' => 'subleasy-import',
	'version' => 1,
	'source' => ['system' => 'wordpress', 'site' => home_url(), 'exported_at' => wp_date('c')],
	'summary' => ['advertisers' => count($advertisers), 'listings' => count($listings), 'by_status' => $by_status],
	'advertisers' => array_values($advertisers),
	'listings' => $listings,
];
