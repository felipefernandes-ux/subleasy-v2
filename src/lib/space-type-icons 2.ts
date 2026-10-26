import {
  CarrotIcon,
  DeskIcon,
  DotsThreeOutlineIcon,
  EarIcon,
  FlowerLotusIcon,
  SmileyIcon,
  SparkleIcon,
  StethoscopeIcon,
  ToothIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { SpaceType } from "./listing-options";

// Os mesmos ícones do formulário do Subleasy atual, um por tipo de sala.
// Versão /ssr: funciona no cabeçalho (servidor) e no formulário (navegador).
export const SPACE_ICONS: Record<SpaceType, Icon> = {
  consultorio_medico: StethoscopeIcon,
  odontologia: ToothIcon,
  psicologia: SmileyIcon,
  estetica: SparkleIcon,
  terapias: FlowerLotusIcon,
  fisioterapia: DeskIcon,
  nutricao: CarrotIcon,
  to_fono: EarIcon,
  outro: DotsThreeOutlineIcon,
};
