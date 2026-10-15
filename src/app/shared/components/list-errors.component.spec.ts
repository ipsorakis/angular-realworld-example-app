import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListErrorsComponent } from "./list-errors.component";

describe("ListErrorsComponent", () => {
  let fixture: ComponentFixture<ListErrorsComponent>;

  const items = (): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("li"),
    ).map((li) => li.textContent!.trim());

  beforeEach(() => {
    fixture = TestBed.createComponent(ListErrorsComponent);
  });

  it("renders one item per error", () => {
    fixture.componentRef.setInput("errors", {
      errors: { email: "is invalid", password: "can't be blank" },
    });
    fixture.detectChanges();

    expect(items()).toEqual(["email is invalid", "password can't be blank"]);
  });

  it("renders nothing for null errors", () => {
    fixture.componentRef.setInput("errors", null);
    fixture.detectChanges();

    expect(fixture.componentInstance.errorList).toEqual([]);
    expect(items()).toEqual([]);
  });

  it("tolerates a payload without an errors map", () => {
    fixture.componentRef.setInput("errors", {} as never);
    fixture.detectChanges();

    expect(items()).toEqual([]);
  });
});
