"use client";
import { ReservationStatus, Role } from "./types";
export type DemoAccount={id:string;name:string;role:Role;email:string};export const demoAccounts:DemoAccount[]=[{id:"demo-user-1",name:"Demo User",role:"USER",email:"rhea@sparc.demo"},{id:"demo-owner-1",name:"Demo Owner",role:"OWNER",email:"aman@sparc.demo"},{id:"demo-city-1",name:"Demo City Operator",role:"CITY_OPERATOR",email:"nisha@sparc.demo"},{id:"demo-admin-1",name:"Demo Admin",role:"ADMIN",email:"admin@sparc.demo"}];
export type DemoReservation={id:string;spaceId:string;space:string;zone:string;start:string;hours:number;amount:number;status:ReservationStatus;reference:string};const key="sparc-demo-reservations";
export function readReservations():DemoReservation[]{if(typeof window==="undefined")return [];try{return JSON.parse(localStorage.getItem(key)??"[]")}catch{return []}}
export function writeReservations(items:DemoReservation[]){localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new Event("sparc-reservations"))}
export function saveReservation(item:DemoReservation){const old=readReservations();writeReservations([item,...old.filter(x=>x.id!==item.id)])}
export function updateDemoReservation(id:string,status:ReservationStatus){const item=readReservations().find(x=>x.id===id);if(!item)return null;const updated={...item,status};saveReservation(updated);return updated}
export function upcomingReservation(){return readReservations().find(x=>["RESERVED","CHECKED_IN","OCCUPIED"].includes(x.status))??null}

