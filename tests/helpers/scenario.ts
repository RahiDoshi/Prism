import {
  AssignmentStatus,
  EventRoleType,
  PlatformRole,
  ProjectStatus,
} from "@prisma/client";
import { prisma } from "../../src/server/src/lib/prisma.js";
import { setFixedClock } from "./clock.js";
import { createUser, grantEventRole, type TestUser } from "./tokens.js";
import { hashToken } from "../../src/server/src/lib/tokens.js";

export type Scenario = {
  now: Date;
  eventId: string;
  trackId: string;
  prizeId: string;
  teamId: string;
  inviteCode: string;
  projectId: string;
  draftProjectId: string;
  criterionKeys: string[];
  assignmentAId: string;
  assignmentBId: string;
  voteId: string;
  commentId: string;
  admin: TestUser;
  organizer: TestUser;
  participant: TestUser;
  judgeA: TestUser;
  judgeB: TestUser;
  outsider: TestUser;
  scopedKey: string;
  unscopedKey: string;
};

export async function seedPermissionScenario(suffix: string = ""): Promise<Scenario> {
  const now = setFixedClock("2026-06-15T12:00:00.000Z");
  const submissionsOpen = new Date("2026-06-01T00:00:00.000Z");
  const submissionsClose = new Date("2026-06-20T00:00:00.000Z");

  const admin = await createUser({
    email: `admin${suffix}@test.local`,
    name: "Admin",
    platformRole: PlatformRole.ADMIN,
  });
  const organizer = await createUser({
    email: `organizer${suffix}@test.local`,
    name: "Organizer",
    platformRole: PlatformRole.ORGANIZER,
  });
  const participant = await createUser({
    email: `participant${suffix}@test.local`,
    name: "Participant",
  });
  const judgeA = await createUser({
    email: `judge-a${suffix}@test.local`,
    name: "Judge A",
  });
  const judgeB = await createUser({
    email: `judge-b${suffix}@test.local`,
    name: "Judge B",
  });
  const outsider = await createUser({
    email: `outsider${suffix}@test.local`,
    name: "Outsider",
  });

  const event = await prisma.event.create({
    data: {
      name: "Matrix Event",
      description: "Permission matrix fixture",
      submissionsOpen,
      submissionsClose,
      publishedAt: now,
      maxTeamSize: 4,
      reviewsPerProject: 2,
    },
  });

  await grantEventRole(organizer.id, event.id, EventRoleType.ORGANIZER);
  await grantEventRole(participant.id, event.id, EventRoleType.PARTICIPANT);
  await grantEventRole(outsider.id, event.id, EventRoleType.PARTICIPANT);
  await grantEventRole(judgeA.id, event.id, EventRoleType.JUDGE);
  await grantEventRole(judgeB.id, event.id, EventRoleType.JUDGE);

  const track = await prisma.track.create({
    data: { eventId: event.id, name: "General", description: "" },
  });
  const prize = await prisma.prize.create({
    data: { eventId: event.id, name: "First", description: "", value: "Trophy" },
  });

  await prisma.judgeTrack.createMany({
    data: [
      { userId: judgeA.id, eventId: event.id, trackId: track.id },
      { userId: judgeB.id, eventId: event.id, trackId: track.id },
    ],
  });

  const criteria = [
    { key: "quality", name: "Quality", weight: 50, position: 0 },
    { key: "impact", name: "Impact", weight: 50, position: 1 },
  ];
  for (const criterion of criteria) {
    await prisma.criterion.create({
      data: {
        eventId: event.id,
        key: criterion.key,
        name: criterion.name,
        weight: criterion.weight,
        minScore: 1,
        maxScore: 5,
        position: criterion.position,
      },
    });
  }

  const draftTeam = await prisma.team.create({
    data: {
      eventId: event.id,
      name: "Draft Team",
      inviteCode: `matrix-invite-code-01${suffix}`,
    },
  });
  await prisma.teamMember.create({
    data: { teamId: draftTeam.id, userId: participant.id, eventId: event.id },
  });
  const draftProject = await prisma.project.create({
    data: {
      eventId: event.id,
      teamId: draftTeam.id,
      trackId: track.id,
      title: "Draft Project",
      summary: "Draft summary",
      repoUrl: "https://example.com/draft",
      demoUrl: "",
      status: ProjectStatus.DRAFT,
    },
  });

  const submittedTeam = await prisma.team.create({
    data: {
      eventId: event.id,
      name: "Submitted Team",
      inviteCode: `matrix-invite-code-02${suffix}`,
    },
  });
  await prisma.teamMember.create({
    data: { teamId: submittedTeam.id, userId: outsider.id, eventId: event.id },
  });
  const project = await prisma.project.create({
    data: {
      eventId: event.id,
      teamId: submittedTeam.id,
      trackId: track.id,
      title: "Submitted Project",
      summary: "Summary",
      repoUrl: "https://example.com/repo",
      demoUrl: "",
      status: ProjectStatus.SUBMITTED,
      submittedAt: now,
    },
  });

  const assignmentA = await prisma.assignment.create({
    data: {
      eventId: event.id,
      judgeId: judgeA.id,
      projectId: project.id,
      status: AssignmentStatus.PENDING,
    },
  });
  const assignmentB = await prisma.assignment.create({
    data: {
      eventId: event.id,
      judgeId: judgeB.id,
      projectId: project.id,
      status: AssignmentStatus.PENDING,
    },
  });

  const vote = await prisma.vote.create({
    data: {
      eventId: event.id,
      voterId: participant.id,
      projectId: project.id,
      trackId: track.id,
      ipHash: "hash123",
      userAgentHash: "ua123",
    },
  });

  const comment = await prisma.comment.create({
    data: {
      eventId: event.id,
      projectId: project.id,
      authorId: outsider.id,
      body: "Matrix comment",
    },
  });

  const uniqueId = suffix || Math.random().toString(36).slice(2);
  const scopedKey = `dfk_scop_${uniqueId}`;
  const unscopedKey = `dfk_unsc_${uniqueId}`;

  const scopedApiKeyRow = await prisma.apiKey.create({
    data: {
      eventId: event.id,
      ownerId: organizer.id,
      name: "Scoped Key",
      prefix: scopedKey.slice(0, 8),
      keyHash: hashToken(scopedKey),
      scopes: ["read", "write"],
    }
  });

  const unscopedApiKeyRow = await prisma.apiKey.create({
    data: {
      ownerId: organizer.id,
      name: "Unscoped Key",
      prefix: unscopedKey.slice(0, 8),
      keyHash: hashToken(unscopedKey),
      scopes: ["read", "write"],
    }
  });

  return {
    now,
    eventId: event.id,
    trackId: track.id,
    prizeId: prize.id,
    teamId: draftTeam.id,
    inviteCode: draftTeam.inviteCode,
    projectId: project.id,
    draftProjectId: draftProject.id,
    criterionKeys: criteria.map((row) => row.key),
    assignmentAId: assignmentA.id,
    assignmentBId: assignmentB.id,
    voteId: vote.id,
    commentId: comment.id,
    admin,
    organizer,
    participant,
    judgeA,
    judgeB,
    outsider,
    scopedKey,
    unscopedKey,
  };
}
