import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { HeaderComponent } from "./header.component";
import { UserService } from "../auth/services/user.service";
import { User } from "../auth/user.model";
import { makeUser, UserServiceStub } from "../../../testing/fixtures";

describe("HeaderComponent", () => {
  function render(user: User | null): HTMLElement {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: new UserServiceStub(user) },
      ],
    });
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const links = (el: HTMLElement) =>
    Array.from(el.querySelectorAll(".nav-link")).map((a) =>
      a.textContent!.trim(),
    );

  it("shows sign in and sign up links to anonymous users", () => {
    const el = render(null);

    expect(links(el)).toEqual(["Home", "Sign in", "Sign up"]);
  });

  it("shows the member navigation with the user's profile link", () => {
    const el = render(makeUser());

    expect(links(el)).toEqual(["Home", "New Article", "Settings", "jake"]);
    const profile = el.querySelector('a[href="/profile/jake"]')!;
    expect(profile.querySelector("img.user-pic")!.getAttribute("src")).toBe(
      "https://example.com/jake.png",
    );
  });

  it("omits the avatar when the user has no image", () => {
    const el = render(makeUser({ image: "" }));

    expect(el.querySelector("img.user-pic")).toBeNull();
  });
});
