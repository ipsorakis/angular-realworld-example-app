import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import SettingsComponent from "./settings.component";
import { UserService } from "../../core/auth/services/user.service";
import { makeUser, UserServiceStub } from "../../../testing/fixtures";

describe("SettingsComponent", () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let users: UserServiceStub;
  let navigate: jasmine.Spy;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    users = new UserServiceStub(makeUser());
    users.getCurrentUser.and.returnValue(of({ user: makeUser() }));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: UserService, useValue: users }],
    });
    navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
  });

  it("requires a password", () => {
    expect(fixture.componentInstance.settingsForm.valid).toBeFalse();

    fixture.componentInstance.settingsForm.patchValue({ password: "secret" });

    expect(fixture.componentInstance.settingsForm.valid).toBeTrue();
  });

  it("saves the settings and navigates to the profile", () => {
    users.update.and.returnValue(of({ user: makeUser({ username: "jacob" }) }));
    const values = {
      image: "https://example.com/new.png",
      username: "jacob",
      bio: "New bio",
      email: "jacob@example.com",
      password: "secret",
    };
    fixture.componentInstance.settingsForm.setValue(values);

    el().querySelector("form")!.dispatchEvent(new Event("submit"));

    expect(users.update).toHaveBeenCalledWith(values);
    expect(navigate).toHaveBeenCalledWith(["/profile/", "jacob"]);
  });

  it("shows API errors and re-enables the form", () => {
    users.update.and.returnValue(
      throwError(() => ({ errors: { email: "has already been taken" } })),
    );

    fixture.componentInstance.submitForm();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting).toBeFalse();
    expect(el().querySelector(".error-messages")!.textContent).toContain(
      "email has already been taken",
    );
  });

  it("logs out", () => {
    el().querySelector<HTMLButtonElement>(".btn-outline-danger")!.click();

    expect(users.logout).toHaveBeenCalled();
  });
});
