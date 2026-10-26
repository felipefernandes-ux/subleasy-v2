import sys,json; sys.path.insert(0,'/tmp/blogwork'); from nmy import nm
import classes
TP,ML,MP='tablet_portrait','mobile_landscape','mobile_portrait'
R={
 'sb-masthead__grid':{f'_gridTemplateColumns:{TP}':'minmax(0, 1fr)'},
 'sb-post-grid':{f'_gridTemplateColumns:{TP}':'repeat(2, minmax(0, 1fr))', f'_gridTemplateColumns:{ML}':'minmax(0, 1fr)'},
 'sb-archive-head__grid':{f'_gridTemplateColumns:{TP}':'minmax(0, 1fr)'},
 'sb-footer__grid':{f'_gridTemplateColumns:{TP}':'repeat(3, minmax(0, 1fr))', f'_gridTemplateColumns:{MP}':'minmax(0, 1fr)'},
 'sb-cta__panel':{f'_gridTemplateColumns:{ML}':'minmax(0, 1fr)'},
 'sb-article-layout':{f'_gridTemplateColumns:{TP}':'minmax(0, 1fr)', f'_widthMax:{TP}':'var(--container-text)'},
 'sb-article-aside':{f'_display:{TP}':'none'},
 'sb-mobile-only':{f'_display:{TP}':'flex'},
 'sb-prose':{f'_typography:{MP}':{'font-size':'1.0625rem'}},
 'sb-article-cover__img':{f'_aspectRatio:{ML}':'16 / 10'},
 'sb-header__actions':{'_cssCustom':None},
 'sb-nav':{f'_order:{TP}':'3'},
 'sb-header__inner':{'_flexWrap':'nowrap', f'_gridGap:{ML}':'0.5rem'},
}
def update(n, extra):
    d=nm('bricks/list-global-classes',{'perPage':200})['data']
    row=next(c for c in d['items'] if c['name']==n)
    settings={k:None for k in row['settings'] if k!='_cssCustom'}
    settings['_cssCustom']=classes.C[n]
    settings.update({k:v for k,v in extra.items() if k!='_cssCustom'})
    own=row.get('itemOwnership') or {**d['ownership'],'itemDigest':row['itemDigest']}
    r=nm('bricks/update-global-class',{'classId':row['id'],'settings':settings,'expectedOwnership':own,'lockOwnership':d['lockOwnership']})
    if not r.get('ok'): print('FAIL',n,json.dumps(r)[:600]); sys.exit(1)
    d2=nm('bricks/list-global-classes',{'perPage':200})['data']
    row2=next(c for c in d2['items'] if c['name']==n)
    print(n,'->',[k for k in row2['settings'] if ':' in k], '| custom:', (row2['settings'].get('_cssCustom') or '')[:80].replace('\n',' '))
for n,e in R.items(): update(n,e)
