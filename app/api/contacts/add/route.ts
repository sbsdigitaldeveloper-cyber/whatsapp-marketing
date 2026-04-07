import { addContact, getContacts } from "@/lib/contact";
import { NextResponse } from "next/server";



export async function POST(req: Request) {
  const body = await req.json();

  let newContacts: { name: string; phone: string }[] = [];

  // Accept array or single contact
  if (Array.isArray(body)) {
    newContacts = body;
  } else if (body.name && body.phone) {
    newContacts = [body];
  } else {
    return NextResponse.json({ error: "Invalid contact data" }, { status: 400 });
  }

  const addedContacts = newContacts.map((c) => addContact(c));

  return NextResponse.json({ success: true, addedContacts, allContacts: getContacts() });
}
