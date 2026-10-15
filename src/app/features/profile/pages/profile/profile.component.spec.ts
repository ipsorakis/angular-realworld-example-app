import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { config, of, throwError } from "rxjs";
import { ProfileComponent } from "./profile.component";
import { ProfileService } from "../../services/profile.service";
import { UserService } from "../../../../core/auth/services/user.service";
import { User } from "../../../../core/auth/user.model";
import {
  makeProfile,
  makeUser,
  UserServiceStub,
} from "../../../../../testing/fixtures";

describe("ProfileComponent", () => {
  let harness: RouterTestingHarness;
  let profiles: jasmine.SpyObj<ProfileService>;
  let navigate: jasmine.Spy;
  const el = () => harness.routeNativeElement as HTMLElement;

  async function open(user: User | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "profile/:username", component: ProfileComponent },
        ]),
        { provide: ProfileService, useValue: profiles },
        { provide: UserService, useValue: new UserServiceStub(user) },
      ],
    });
    harness = await RouterTestingHarness.create();
    navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
    const component = await harness.navigateByUrl(
      "/profile/jake",
      ProfileComponent,
    );
    harness.detectChanges();
    return component;
  }

  beforeEach(() => {
    profiles = jasmine.createSpyObj<ProfileService>("ProfileService", ["get"]);
    profiles.get.and.returnValue(of(makeProfile()));
  });

  it("shows the profile with a follow button to other users", async () => {
    const component = await open(makeUser({ username: "anna" }));

    expect(profiles.get).toHaveBeenCalledWith("jake");
    expect(component.isUser).toBeFalse();
    expect(el().querySelector("h4")!.textContent).toBe("jake");
    expect(el().textContent).toContain("I work at statefarm");
    expect(el().querySelector("app-follow-button")).not.toBeNull();
    expect(
      el().querySelector('a[href="/profile/jake/favorites"]'),
    ).not.toBeNull();
  });

  it("shows the settings link on the user's own profile", async () => {
    const component = await open(makeUser());

    expect(component.isUser).toBeTrue();
    expect(el().textContent).toContain("Edit Profile Settings");
    expect(el().querySelector("app-follow-button")).toBeNull();
  });

  it("updates the profile when following is toggled", async () => {
    const component = await open(null);
    const followed = makeProfile({ following: true });

    component.onToggleFollowing(followed);

    expect(component.profile).toBe(followed);
  });

  it("redirects home when the profile cannot be loaded", async () => {
    const original = config.onUnhandledError;
    config.onUnhandledError = () => undefined;
    profiles.get.and.returnValue(throwError(() => new Error("404")));
    try {
      await open(null);
    } finally {
      config.onUnhandledError = original;
    }

    expect(navigate).toHaveBeenCalledWith(["/"]);
  });
});
