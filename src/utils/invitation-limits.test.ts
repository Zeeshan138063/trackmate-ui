import { describe, expect, it } from "vitest";
import { invitationUsage } from "./invitation-limits";

const TODAY = "2026-11-26";
const many = (n: number, day: string) => Array.from({ length: n }, () => `${day}T10:00:00.000Z`);

describe("AC-2 invitationUsage", () => {
  it("counts today and the six days before it, and nothing else", () => {
    const u = invitationUsage(["2026-11-26T23:00:00Z", "2026-11-20T00:10:00Z", "2026-11-19T23:59:00Z", "2026-11-27T00:00:00Z", null, undefined, ""], TODAY);
    expect(u).toEqual({ count: 2, state: "ok", nextSlotOn: null });
  });

  it("is ok below 80, warns from 80 to 99, stops at 100", () => {
    expect(invitationUsage(many(79, TODAY), TODAY).state).toBe("ok");
    expect(invitationUsage(many(80, TODAY), TODAY).state).toBe("warn");
    expect(invitationUsage(many(99, TODAY), TODAY).state).toBe("warn");
    expect(invitationUsage(many(100, TODAY), TODAY).state).toBe("stop");
    expect(invitationUsage(many(140, TODAY), TODAY).state).toBe("stop");
    expect(invitationUsage([], TODAY)).toEqual({ count: 0, state: "ok", nextSlotOn: null });
  });

  it("at the limit, the next slot is seven days after the oldest counted invitation", () => {
    const sent = [...many(30, "2026-11-21"), ...many(70, "2026-11-25")];
    expect(invitationUsage(sent, TODAY)).toEqual({ count: 100, state: "stop", nextSlotOn: "2026-11-28" });
  });

  it("over the limit, enough of the oldest must leave first", () => {
    // 105 sent: 3 on the 21st, 102 on the 25th. Dropping the 3 leaves 102, still over,
    // so the next slot only comes when the 25th leaves the window.
    const sent = [...many(3, "2026-11-21"), ...many(102, "2026-11-25")];
    expect(invitationUsage(sent, TODAY).nextSlotOn).toBe("2026-12-02");
    // 101 sent: 5 on the 21st, 96 on the 25th. Dropping 2 of the 5 is enough.
    expect(invitationUsage([...many(5, "2026-11-21"), ...many(96, "2026-11-25")], TODAY).nextSlotOn).toBe("2026-11-28");
  });

  it("an old burst no longer counts once it leaves the window", () => {
    expect(invitationUsage(many(100, "2026-11-19"), TODAY)).toEqual({ count: 0, state: "ok", nextSlotOn: null });
    expect(invitationUsage(many(100, "2026-11-20"), TODAY).state).toBe("stop");
  });
});
