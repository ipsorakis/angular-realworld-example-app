import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AppComponent } from "./app.component";
import { UserService } from "./core/auth/services/user.service";
import { UserServiceStub } from "../testing/fixtures";

describe("AppComponent", () => {
  it("renders the header, router outlet and footer", () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: new UserServiceStub() },
      ],
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector("app-layout-header")).not.toBeNull();
    expect(el.querySelector("router-outlet")).not.toBeNull();
    expect(el.querySelector("app-layout-footer")).not.toBeNull();
  });
});
