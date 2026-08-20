import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WCL_DIFFICULTIES, WclScope, parseWclScope } from '../../domain/wcl-scope';

@Component({
  selector: 'app-wcl-scope-form',
  imports: [ReactiveFormsModule],
  templateUrl: './wcl-scope-form.component.html',
  styleUrl: './wcl-scope-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WclScopeFormComponent {
  readonly initialScope = input<WclScope | null>(null);
  readonly loading = input(false);
  readonly label = input('WCL analysis scope');
  readonly scopeSubmitted = output<WclScope>();

  protected readonly difficulties = WCL_DIFFICULTIES;
  protected readonly form = new FormGroup({
    report: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/)] }),
    encounter: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    difficulty: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
  });

  constructor() {
    effect(() => {
      const scope = this.initialScope();
      if (!scope) return;
      this.form.setValue({
        report: scope.reportCode,
        encounter: scope.encounterId,
        difficulty: scope.difficulty,
      }, { emitEvent: false });
    });
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const scope = parseWclScope(value.report, String(value.encounter ?? ''), String(value.difficulty ?? ''));
    if (this.form.invalid || !scope) return;
    this.scopeSubmitted.emit(scope);
  }
}
