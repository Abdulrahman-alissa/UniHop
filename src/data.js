// Static UI constants (campuses, areas, tags). Rides, users and bookings now come from the API.
export const CAMPUSES = ["LAU Beirut", "LAU Byblos"];
// Facts taken from LAU's Beirut and Byblos location pages
export const CAMPUS_INFO = {
  "LAU Beirut": {
    url: "https://www.lau.edu.lb/about/locations/beirut.php",
    blurb: "Koraytem, four blocks south of Hamra. Jounieh, Baabda, Aley and Saida rides end here.",
    tip: "LAU says traffic around Koraytem is usually heavy after 8 a.m., and street parking is hard to find. Sharing one car saves both.",
    gate: "Lower gate, Koraytem",
  },
  "LAU Byblos": {
    url: "https://www.lau.edu.lb/about/locations/byblos.php",
    blurb: "Blat hillside above Jbeil, 35 km north of Beirut. Batroun, Tripoli and Jounieh rides end here.",
    tip: "LAU lists an underground parking permit at $177 per semester. Splitting a ride beats paying it alone.",
    gate: "Lower gate, Blat",
  },
};
export const AREAS = ["Aley", "Baabda", "Batroun", "Beirut", "Byblos", "Hamra", "Jounieh", "Kaslik", "Saida", "Tripoli"];
export const RIDE_TAGS = ["Quiet ride", "Music OK", "Air-conditioned", "Luggage space", "Study-friendly", "Non-smoking"];
export const GENDERS = [["female", "Girl"], ["male", "Boy"]];
export const DEMO = { email: "test.female@lau.edu", password: "carpool123" };
