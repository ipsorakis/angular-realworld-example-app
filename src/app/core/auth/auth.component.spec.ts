import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { of, throwError } from "rxjs";
import AuthComponent from "./auth.component";
import { UserService } from "./services/user.service";
import { makeUser, UserServiceStub } from "../../../testing/fixtures";

describe("AuthComponent", () => {
  let harness: RouterTestingHarness;
  let users: UserServiceStub;
  let navigate: jasmine.Spy;

  async function open(url: "/login" | "/register") {
    const component = await harness.navigateByUrl(url, AuthComponent);
    harness.detectChanges();
    return component;
  }

  const el = () => harness.routeNativeElement as HTMLElement;

  function type(placeholder: string, value: string) {
    const input = el().querySelector<HTMLInputElement>(
      `input[placeholder="${placeholder}"]`,
    )!;
    input.value = value;
    input.dispatchEvent(new Event("input"));
  }

  function submit() {
    el().querySelector("form")!.dispatchEvent(new Event("submit"));
    harness.detectChanges();
  }

  beforeEach(async () => {
    users = new UserServiceStub();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "login", component: AuthComponent },
          { path: "register", component: AuthComponent },
        ]),
        { provide: UserService, useValue: users },
      ],
    });
    harness = await RouterTestingHarness.create();
    navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
  });

  it("renders the sign in form on /login", async () => {
    const component = await open("/login");

    expect(component.title).toBe("Sign in");
    expect(el().querySelector("h1")!.textContent).toContain("Sign in");
    expect(el().querySelector('input[placeholder="Username"]')).toBeNull();
    expect(el().querySelector('a[href="/register"]')).not.toBeNull();
  });

  it("renders the sign up form with a username field on /register", async () => {
    const component = await open("/register");

    expect(component.title).toBe("Sign up");
    expect(component.authForm.contains("username")).toBeTrue();
    expect(el().querySelector('input[placeholder="Username"]')).not.toBeNull();
    expect(el().querySelector('a[href="/login"]')).not.toBeNull();
  });

  it("keeps the submit button disabled until the form is valid", async () => {
    await open("/login");
    const button = el().querySelector<HTMLButtonElement>("button")!;
    expect(button.disabled).toBeTrue();

    type("Email", "jake@jake.jake");
    type("Password", "secret");
    harness.detectChanges();

    expect(button.disabled).toBeFalse();
  });

  it("logs in and navigates home", async () => {
    users.login.and.returnValue(of({ user: makeUser() }));
    await open("/login");
    type("Email", "jake@jake.jake");
    type("Password", "secret");

    submit();

    expect(users.login).toHaveBeenCalledWith({
      email: "jake@jake.jake",
      password: "secret",
    });
    expect(navigate).toHaveBeenCalledWith(["/"]);
  });

  it("registers and navigates home", async () => {
    users.register.and.returnValue(of({ user: makeUser() }));
    await open("/register");
    type("Username", "jake");
    type("Email", "jake@jake.jake");
    type("Password", "secret");

    submit();

    expect(users.register).toHaveBeenCalledWith({
      email: "jake@jake.jake",
      password: "secret",
      username: "jake",
    });
    expect(navigate).toHaveBeenCalledWith(["/"]);
  });

  it("shows API errors and re-enables the form", async () => {
    users.login.and.returnValue(
      throwError(() => ({ errors: { "email or password": "is invalid" } })),
    );
    const component = await open("/login");
    type("Email", "jake@jake.jake");
    type("Password", "wrong");

    submit();

    expect(component.isSubmitting).toBeFalse();
    expect(el().querySelector(".error-messages")!.textContent).toContain(
      "email or password is invalid",
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
