import {
  ArmchairIcon,
  BedIcon,
  BroomIcon,
  CarIcon,
  CheckCircleIcon,
  DeskIcon,
  DropIcon,
  ElevatorIcon,
  SnowflakeIcon,
  SpeakerSimpleSlashIcon,
  ToiletIcon,
  WheelchairIcon,
  WifiHighIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

// Ícone de cada comodidade da lista fixa. As que a IA trouxer de fora ficam com o ícone padrão.
// Versão /ssr: funciona tanto na página pública (servidor) quanto no formulário (navegador).
export const AMENITY_ICONS: Record<string, Icon> = {
  ar_condicionado: SnowflakeIcon,
  wifi: WifiHighIcon,
  recepcao: DeskIcon,
  sala_de_espera: ArmchairIcon,
  maca: BedIcon,
  pia: DropIcon,
  banheiro_privativo: ToiletIcon,
  estacionamento: CarIcon,
  elevador: ElevatorIcon,
  acessibilidade: WheelchairIcon,
  isolamento_acustico: SpeakerSimpleSlashIcon,
  limpeza_inclusa: BroomIcon,
};

export const DEFAULT_AMENITY_ICON = CheckCircleIcon;
