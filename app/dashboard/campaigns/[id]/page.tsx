// app/dashboard/campaigns/[id]/page.tsx
import CampaignDetail from "./CampaignDetail";
import { prisma } from "@/lib/prisma";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  // unwrap params if it's a promise
  const resolvedParams = await params;
  const campaignId = Number(resolvedParams.id);

  if (isNaN(campaignId)) {
    return <p>Invalid campaign ID</p>;
  }

  // fetch campaign from DB
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return <p>Campaign not found</p>;
  }

  // fetch all contacts for the campaign's user
  const contactsRaw = await prisma.contact.findMany({
    where: { userId: campaign.userId },
    orderBy: { createdAt: "desc" },
  });

  // convert null names to undefined
  const contacts = contactsRaw.map((c) => ({
    ...c,
    name: c.name ?? undefined,
  }));

  return <CampaignDetail campaign={campaign} contacts={contacts} />;
}