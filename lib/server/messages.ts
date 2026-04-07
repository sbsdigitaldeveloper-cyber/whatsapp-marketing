import { prisma } from "@/lib/prisma";

export async function getMessages(
  userId: number,
  filters?: {
    contactId?: string | null;
    campaignId?: string | null;
    status?: string | null;
    search?: string | null;
  }
) {
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      ...(filters?.contactId ? { id: Number(filters.contactId) } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search } },
              { phone: { contains: filters.search } },
            ],
          }
        : {}),
    },
    include: {
      messages: {
        where: {
          ...(filters?.campaignId
            ? { campaignId: Number(filters.campaignId) }
            : {}),
          ...(filters?.status ? { status: filters.status } : {}),
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              messageType: true,
              message: true,
              templateName: true,
              templateParams: true,
              status: true,
            },
          },
        },
        orderBy: { sentAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return contacts;
}