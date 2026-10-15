import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ProfileService } from "./profile.service";
import { makeProfile } from "../../../../testing/fixtures";

describe("ProfileService", () => {
  let service: ProfileService;
  let http: HttpTestingController;
  const profile = makeProfile();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("gets a profile and shares the response between subscribers", () => {
    const profile$ = service.get("jake");
    const received: unknown[] = [];

    profile$.subscribe((p) => received.push(p));
    profile$.subscribe((p) => received.push(p));
    http.expectOne("/profiles/jake").flush({ profile });

    expect(received).toEqual([profile, profile]);
  });

  it("follows a user", () => {
    let result: unknown;
    service.follow("jake").subscribe((p) => (result = p));

    const req = http.expectOne("/profiles/jake/follow");
    expect(req.request.method).toBe("POST");
    req.flush({ profile: { ...profile, following: true } });
    expect(result).toEqual({ ...profile, following: true });
  });

  it("unfollows a user", () => {
    let result: unknown;
    service.unfollow("jake").subscribe((p) => (result = p));

    const req = http.expectOne("/profiles/jake/follow");
    expect(req.request.method).toBe("DELETE");
    req.flush({ profile });
    expect(result).toEqual(profile);
  });
});
