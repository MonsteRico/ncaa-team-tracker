import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function conferenceAbbrevToFull(conference: string) {
  switch (conference) {
    case "acc":
      return "Atlantic Coast Conference";
    case "a-east":
      return "America East";
    case "aac":
      return "American Athletic Conference";
    case "a-10":
      return "Atlantic 10";
    case "a-sun":
      return "Atlantic Sun";
    case "big12":
      return "Big 12";
    case "big-east":
      return "Big East";
    case "big-sky":
      return "Big Sky";
    case "b-south":
      return "Big South";
    case "bigten":
      return "Big 10";
    case "big12":
      return "Big 12";
    case "big-west":
      return "Big West";
    case "caa":
      return "Colonial Athletic Association";
    case "c-usa":
      return "Conference USA";
    case "horizon":
      return "Horizon League";
    case "ivy":
      return "Ivy League";
    case "maac":
      return "Metro Atlantic Athletic Conference";
    case "meac":
      return "Mid-Eastern Athletic Conference";
    case "mac":
      return "Mid-American Conference";
    case "mvc":
      return "Missouri Valley Conference";
    case "mw":
      return "Mountain West";
    case "nec":
      return "Northeast Conference";
    case "ovc":
      return "Ohio Valley Conference";
    case "pac-12":
      return "Pac-12";
    case "patriot":
      return "Patriot League";
    case "sec":
      return "Southeastern Conference";
    case "southern":
      return "Southern Conference";
    case "slc":
      return "Southland Conference";
    case "summit":
      return "Summit League";
    case "sbc":
      return "Sun Belt Conference";
    case "sw-ac":
      return "Southwestern Athletic Conference";
    case "wac":
      return "Western Athletic Conference";
    case "wcc":
      return "West Coast Conference";
    default:
      return conference;
  }
}
