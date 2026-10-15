import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { FollowButtonComponent } from "./follow-button.component";
import { ProfileService } from "../services/profile.service";
import { UserService } from "../../../core/auth/services/user.service";
import { Profile } from "../models/profile.model";
import {
  makeProfile,
  makeUser,
  UserServiceStub,
} from "../../../../testing/fixtures";

describe("FollowButtonComponent", () => {
  let fixture: ComponentFixture<FollowButtonComponent>;
  let profiles: jasmine.SpyObj<ProfileService>;
  let router: jasmine.SpyObj<Router>;
  let users: UserServiceStub;
  let emitted: Profile[];

  function setup(profile: Profile) {
    fixture = TestBed.createComponent(FollowButtonComponent);
    fixture.componentRef.setInput("profile", profile);
    emitted = [];
    fixture.componentInstance.toggle.subscribe((p) => emitted.push(p));
    fixture.detectChanges();
  }

  const button = () =>
    (fixture.nativeElement as HTMLElement).querySelector("button")!;

  beforeEach(() => {
    profiles = jasmine.createSpyObj<ProfileService>("ProfileService", [
      "follow",
      "unfollow",
    ]);
    router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    router.navigate.and.resolveTo(true);
    users = new UserServiceStub(makeUser({ username: "anna" }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileService, useValue: profiles },
        { provide: Router, useValue: router },
        { provide: UserService, useValue: users },
      ],
    });
  });

  it("follows a user that is not yet followed", () => {
    const followed = makeProfile({ following: true });
    profiles.follow.and.returnValue(of(followed));
    setup(makeProfile({ following: false }));
    expect(button().textContent).toContain("Follow jake");
    expect(button().classList).toContain("btn-outline-secondary");

    button().click();

    expect(profiles.follow).toHaveBeenCalledWith("jake");
    expect(emitted).toEqual([followed]);
    expect(fixture.componentInstance.isSubmitting).toBeFalse();
  });

  it("unfollows a followed user", () => {
    const unfollowed = makeProfile({ following: false });
    profiles.unfollow.and.returnValue(of(unfollowed));
    setup(makeProfile({ following: true }));
    expect(button().textContent).toContain("Unfollow jake");
    expect(button().classList).toContain("btn-secondary");

    button().click();

    expect(profiles.unfollow).toHaveBeenCalledWith("jake");
    expect(emitted).toEqual([unfollowed]);
  });

  it("sends anonymous users to the login page", () => {
    users.user$.next(null);
    setup(makeProfile());

    button().click();

    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
    expect(profiles.follow).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it("re-enables the button when the request fails", () => {
    profiles.follow.and.returnValue(throwError(() => new Error("boom")));
    setup(makeProfile());

    button().click();

    expect(fixture.componentInstance.isSubmitting).toBeFalse();
    expect(emitted).toEqual([]);
  });
});
