import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  authHeader,
  clearFixedClock,
  getTestApp,
  resetDatabase,
  seedPermissionScenario,
  type Scenario,
} from "../helpers/index.js";
import { prisma } from "../../src/server/src/lib/prisma.js";

type Actor = "anonymous" | "participant" | "judgeA" | "judgeB" | "organizer" | "admin" | "scopedKey" | "unscopedKey";

const ACTORS: Actor[] = [
  "anonymous",
  "participant",
  "judgeA",
  "judgeB",
  "organizer",
  "admin",
  "scopedKey",
  "unscopedKey",
];

type MatrixCase = {
  name: string;
  method: "get" | "post" | "patch" | "put" | "delete";
  path: (s: Scenario) => string;
  body?: (s: Scenario) => unknown;
  prepare?: (s: Scenario) => Promise<void>;
  expected: Record<Actor, number>;
};

function tokenFor(scenario: Scenario, actor: Actor): string | null {
  switch (actor) {
    case "anonymous":
      return null;
    case "participant":
      return scenario.participant.token;
    case "judgeA":
      return scenario.judgeA.token;
    case "judgeB":
      return scenario.judgeB.token;
    case "organizer":
      return scenario.organizer.token;
    case "admin":
      return scenario.admin.token;
    case "scopedKey":
      return scenario.scopedKey;
    case "unscopedKey":
      return scenario.unscopedKey;
  }
}

describe("api/permission-matrix", () => {
  let scenario: Scenario;
  const app = getTestApp();

  beforeAll(async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    clearFixedClock();
  });

  const cases: MatrixCase[] = [
    {
      name: "GET /api/auth/me",
      method: "get",
      path: () => "/api/auth/me",
      expected: {
        anonymous: 401,
        participant: 200,
        judgeA: 200,
        judgeB: 200,
        organizer: 200,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/auth/logout",
      method: "post",
      path: () => "/api/auth/logout",
      expected: {
        anonymous: 401,
        participant: 204,
        judgeA: 204,
        judgeB: 204,
        organizer: 204,
        admin: 204,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/admin/users",
      method: "get",
      path: () => "/api/admin/users",
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "PATCH /api/admin/users/:userId",
      method: "patch",
      path: (s) => `/api/admin/users/${s.outsider.id}`,
      body: () => ({ platformRole: "USER" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/events",
      method: "post",
      path: () => "/api/events",
      body: (s) => ({
        name: `Event ${s.now.toISOString()}`,
        description: "",
        submissionsOpen: "2026-06-01T00:00:00.000Z",
        submissionsClose: "2026-06-30T00:00:00.000Z",
        maxTeamSize: 4,
        reviewsPerProject: 3,
        tracks: [],
        prizes: [],
      }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 201,
        admin: 201,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "PATCH /api/events/:eventId",
      method: "patch",
      path: (s) => `/api/events/${s.eventId}`,
      body: () => ({ description: "updated" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/publish",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/publish`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/tracks",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/tracks`,
      body: () => ({ name: "New Track", description: "" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 201,
        admin: 201,
        scopedKey: 201,
        unscopedKey: 201,
      },
    },
    {
      name: "PATCH /api/events/:eventId/tracks/:trackId",
      method: "patch",
      path: (s) => `/api/events/${s.eventId}/tracks/${s.trackId}`,
      body: () => ({ description: "updated track" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "DELETE /api/events/:eventId/tracks/:trackId",
      method: "delete",
      path: (s) => `/api/events/${s.eventId}/tracks/${s.trackId}`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 409,
        admin: 409,
        scopedKey: 409,
        unscopedKey: 409,
      },
    },
    {
      name: "POST /api/events/:eventId/prizes",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/prizes`,
      body: () => ({ name: "Prize", description: "", value: "" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 201,
        admin: 201,
        scopedKey: 201,
        unscopedKey: 201,
      },
    },
    {
      name: "PATCH /api/events/:eventId/prizes/:prizeId",
      method: "patch",
      path: (s) => `/api/events/${s.eventId}/prizes/${s.prizeId}`,
      body: () => ({ description: "updated prize" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "DELETE /api/events/:eventId/prizes/:prizeId",
      method: "delete",
      path: (s) => `/api/events/${s.eventId}/prizes/${s.prizeId}`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 204,
        admin: 204,
        scopedKey: 204,
        unscopedKey: 204,
      },
    },
    {
      name: "POST /api/events/:eventId/teams",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/teams`,
      body: () => ({ name: "Fresh Team" }),
      expected: {
        anonymous: 401,
        participant: 409,
        judgeA: 409,
        judgeB: 409,
        organizer: 201,
        admin: 201,
        scopedKey: 201,
        unscopedKey: 201,
      },
    },
    {
      name: "GET /api/teams/mine",
      method: "get",
      path: () => "/api/teams/mine",
      expected: {
        anonymous: 401,
        participant: 200,
        judgeA: 200,
        judgeB: 200,
        organizer: 200,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/teams/:teamId/invite/rotate",
      method: "post",
      path: (s) => `/api/teams/${s.teamId}/invite/rotate`,
      expected: {
        anonymous: 401,
        participant: 200,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "DELETE /api/teams/:teamId/members/me",
      method: "delete",
      path: (s) => `/api/teams/${s.teamId}/members/me`,
      expected: {
        anonymous: 401,
        participant: 204,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/projects",
      method: "post",
      path: () => "/api/projects",
      body: (s) => ({
        eventId: s.eventId,
        title: "Another",
        summary: "s",
        repoUrl: "https://example.com/x",
        demoUrl: "",
        trackId: s.trackId,
      }),
      expected: {
        anonymous: 401,
        participant: 409,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "PATCH /api/projects/:projectId",
      method: "patch",
      path: (s) => `/api/projects/${s.draftProjectId}`,
      body: () => ({ summary: "edited" }),
      expected: {
        anonymous: 401,
        participant: 200,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/projects/:projectId/submit",
      method: "post",
      path: (s) => `/api/projects/${s.draftProjectId}/submit`,
      expected: {
        anonymous: 401,
        participant: 200,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/projects/:projectId/clear-duplicate",
      method: "post",
      path: (s) => `/api/projects/${s.projectId}/clear-duplicate`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/criteria",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/criteria`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 200,
        judgeB: 200,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "PUT /api/events/:eventId/criteria",
      method: "put",
      path: (s) => `/api/events/${s.eventId}/criteria`,
      body: () => ({
        criteria: [
          {
            key: "quality",
            name: "Quality",
            description: "",
            weight: 60,
            minScore: 1,
            maxScore: 5,
          },
          {
            key: "impact",
            name: "Impact",
            description: "",
            weight: 40,
            minScore: 1,
            maxScore: 5,
          },
        ],
      }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/judges",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/judges`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/judges/invites",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/judges/invites`,
      body: () => ({ email: "new-judge@test.local", trackIds: [] }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 201,
        admin: 201,
        scopedKey: 201,
        unscopedKey: 201,
      },
    },
    {
      name: "PUT /api/events/:eventId/judges/:userId/tracks",
      method: "put",
      path: (s) => `/api/events/${s.eventId}/judges/${s.judgeA.id}/tracks`,
      body: (s) => ({ trackIds: [s.trackId] }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "DELETE /api/events/:eventId/judges/:userId",
      method: "delete",
      path: (s) => `/api/events/${s.eventId}/judges/${s.judgeB.id}`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 204,
        admin: 204,
        scopedKey: 204,
        unscopedKey: 204,
      },
    },
    {
      name: "GET /api/events/:eventId/assignments",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/assignments`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/assignments/auto",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/assignments/auto`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/assignments",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/assignments`,
      body: (s) => ({ judgeId: s.judgeA.id, projectId: s.projectId }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 409,
        admin: 409,
        scopedKey: 409,
        unscopedKey: 409,
      },
    },
    {
      name: "DELETE /api/assignments/:assignmentId",
      method: "delete",
      path: (s) => `/api/assignments/${s.assignmentBId}`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 204,
        admin: 204,
        scopedKey: 204,
        unscopedKey: 204,
      },
    },
    {
      name: "GET /api/judge/assignments",
      method: "get",
      path: () => "/api/judge/assignments",
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 200,
        judgeB: 200,
        organizer: 403,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/judge/assignments/:assignmentId (A)",
      method: "get",
      path: (s) => `/api/judge/assignments/${s.assignmentAId}`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 200,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "PUT /api/judge/assignments/:assignmentId/scores",
      method: "put",
      path: (s) => `/api/judge/assignments/${s.assignmentAId}/scores`,
      body: () => ({
        scores: { quality: 4, impact: 4 },
        comment: "",
        submit: false,
      }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/judge/scores (own)",
      method: "get",
      path: () => "/api/judge/scores",
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 200,
        judgeB: 200,
        organizer: 403,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/judge/scores?judge=A (peer)",
      method: "get",
      path: (s) => `/api/judge/scores?judge=${s.judgeA.id}&eventId=${s.eventId}`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 200,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/dashboard",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/dashboard`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/results (unpublished)",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/results`,
      expected: {
        anonymous: 403,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/results/publish",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/results/publish`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/results/unpublish",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/results/unpublish`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/export.csv",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/export.csv?type=results`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/audit",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/audit`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/teams/invite/:code/join",
      method: "post",
      path: (s) => `/api/teams/invite/${s.inviteCode}/join`,
      expected: {
        anonymous: 401,
        participant: 409,
        judgeA: 409,
        judgeB: 409,
        organizer: 200,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/judge-invites/:token/accept",
      method: "post",
      path: () => "/api/judge-invites/not-a-real-token/accept",
      expected: {
        anonymous: 401,
        participant: 404,
        judgeA: 404,
        judgeB: 404,
        organizer: 404,
        admin: 404,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/events/:eventId/community-results (during voting)",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/community-results`,
      expected: {
        anonymous: 403,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 403,
        admin: 403,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/events/:eventId/community-turnout",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/community-turnout`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/votes/flagged",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/votes/flagged`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/votes/:voteId/void",
      method: "post",
      path: (s) => `/api/votes/${s.voteId}/void`,
      body: () => ({ reason: "spam" }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/votes/:voteId/restore",
      method: "post",
      path: (s) => `/api/votes/${s.voteId}/restore`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/records/issue",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/records/issue`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/me/certificates",
      method: "get",
      path: () => "/api/me/certificates",
      expected: {
        anonymous: 401,
        participant: 200,
        judgeA: 200,
        judgeB: 200,
        organizer: 200,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "GET /api/events/:eventId/certificates",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/certificates`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/events/:eventId/certificates/issue",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/certificates/issue`,
      prepare: async (s) => {
        await prisma.event.update({
          where: { id: s.eventId },
          data: { resultsPublishedAt: s.now },
        });
      },
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "GET /api/events/:eventId/webhooks",
      method: "get",
      path: (s) => `/api/events/${s.eventId}/webhooks`,
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 200,
        unscopedKey: 200,
      },
    },
    {
      name: "POST /api/import",
      method: "post",
      path: () => `/api/import?dryRun=true`,
      body: (s) => ({ event: { id: "evt_new", name: "New Event" } }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
    {
      name: "POST /api/events/:eventId/import.json",
      method: "post",
      path: (s) => `/api/events/${s.eventId}/import.json?dryRun=true`,
      body: (s) => ({ event: { id: s.eventId, name: "Existing Event" } }),
      expected: {
        anonymous: 401,
        participant: 403,
        judgeA: 403,
        judgeB: 403,
        organizer: 200,
        admin: 200,
        scopedKey: 403,
        unscopedKey: 403,
      },
    },
  ];

  for (const matrixCase of cases) {
    describe(matrixCase.name, () => {
      beforeEach(async () => {
        await resetDatabase();
        scenario = await seedPermissionScenario();
        if (matrixCase.prepare) {
          await matrixCase.prepare(scenario);
        }
      });

      for (const actor of ACTORS) {
        it(`${actor} → ${matrixCase.expected[actor]}`, async () => {
          const token = tokenFor(scenario, actor);
          const targetPath = matrixCase.path(scenario);
          let req = request(app)[matrixCase.method](targetPath).set(authHeader(token));
          if (matrixCase.body) {
            req = req.send(matrixCase.body(scenario));
          }
          const response = await req;
          expect(response.status).toBe(matrixCase.expected[actor]);
        });
      }
    });
  }
});
