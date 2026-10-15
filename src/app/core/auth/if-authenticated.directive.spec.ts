import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { IfAuthenticatedDirective } from "./if-authenticated.directive";
import { UserService } from "./services/user.service";
import { makeUser, UserServiceStub } from "../../../testing/fixtures";

@Component({
  template: `
    <p *ifAuthenticated="true" id="members">members</p>
    <p *ifAuthenticated="false" id="guests">guests</p>
  `,
  imports: [IfAuthenticatedDirective],
})
class HostComponent {}

describe("IfAuthenticatedDirective", () => {
  let fixture: ComponentFixture<HostComponent>;
  let users: UserServiceStub;

  const visible = (id: string) =>
    !!(fixture.nativeElement as HTMLElement).querySelector(`#${id}`);

  beforeEach(() => {
    users = new UserServiceStub();
    TestBed.configureTestingModule({
      providers: [{ provide: UserService, useValue: users }],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it("shows guest content to anonymous users", () => {
    expect(visible("guests")).toBeTrue();
    expect(visible("members")).toBeFalse();
  });

  it("swaps content when the user logs in and out", () => {
    users.user$.next(makeUser());
    fixture.detectChanges();
    expect(visible("members")).toBeTrue();
    expect(visible("guests")).toBeFalse();

    users.user$.next(null);
    fixture.detectChanges();
    expect(visible("members")).toBeFalse();
    expect(visible("guests")).toBeTrue();
  });
});
