import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { FooterComponent } from "./footer.component";

describe("FooterComponent", () => {
  it("shows the current year", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      `© ${new Date().getFullYear()}.`,
    );
  });
});
