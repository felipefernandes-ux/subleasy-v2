import { CityLanding, cityMetadata } from "@/components/city-landing";
import { findCityPageBySlug } from "@/lib/city-pages";

const city = findCityPageBySlug("santo-andre-sp")!;

export const generateMetadata = () => cityMetadata(city);

export default function Page() {
  return <CityLanding city={city} />;
}
