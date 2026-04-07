import { getContacts } from "@/lib/contact";
import { NextResponse } from "next/server";


export async function GET() {
  return NextResponse.json(getContacts());
}
