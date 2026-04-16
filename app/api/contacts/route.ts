import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/auth"; // ✅ import shared auth helper

// GET - Fetch all contacts for logged-in user
export async function GET(req: NextRequest) {


  const payload = await getTokenPayload(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const userId = payload.userId; 

  try {
    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("GET contacts error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

// POST - Add contacts (single or bulk)
export async function POST(req: NextRequest) {
    const payload = await getTokenPayload(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const userId = payload.userId; 

  try {
    const { contacts } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided. Send array of {name, phone}" },
        { status: 400 }
      );
    }

    let added = 0;
    let skipped = 0;

    for (const c of contacts) {
      if (!c.phone || !c.phone.trim()) {
        skipped++;
        continue;
      }

      try {
        await prisma.contact.create({
          data: {
            name: c.name?.trim() || null,
            phone: c.phone.trim(),
            userId,
          },
        });
        added++;
      } catch (error: any) {
        if (error.code === "P2002") {
          skipped++;
        } else {
          console.error("Error creating contact:", error);
          skipped++;
        }
      }
    }

    return NextResponse.json(
      {
        message: `${added} contact(s) added${skipped > 0 ? `, ${skipped} skipped (duplicates or invalid)` : ""}`,
        added,
        skipped,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST contacts error:", error);
    return NextResponse.json({ error: "Failed to add contacts" }, { status: 500 });
  }
}

// DELETE - Delete a contact
export async function DELETE(req: NextRequest) {
   const payload = await getTokenPayload(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const userId = payload.userId; 

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
    }

    const deleted = await prisma.contact.deleteMany({
      where: {
        id: Number(id),
        userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("DELETE contact error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}