import Mapbox from "@rnmapbox/maps";
import { MAPBOX_TOKEN } from "@/config/constants";

Mapbox.setAccessToken(MAPBOX_TOKEN);

export default Mapbox;