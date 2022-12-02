import {CommonModule} from '@angular/common';
import {
  AfterViewInit,
  Compiler,
  Component,
  ComponentRef,
  Injector,
  NgModule,
  NgModuleRef,
  OnDestroy, OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Topic} from "../../statics/topic";
import {Info, Infos} from "../../statics/infos";
import {MatDialog} from "@angular/material/dialog";
import {CoursComponent} from "../../components/modal/cours/cours.component";
import {Cours} from "../../models/cours";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule} from "@angular/forms";
import {AppModule} from "../../app.module";
import {AppRoutingModule} from "../../app-routing.module";
import {StylePipe} from "../../pipes/style.pipe";
import {NotesComponent} from "../../components/modal/notes/notes.component";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-exercice',
  templateUrl: './exercice.component.html',
  styleUrls: ['./exercice.component.css']
})
export class ExerciceComponent implements OnDestroy, AfterViewInit {
  topic?: Topic;
  info?: Info;
  @ViewChild('vc', {read: ViewContainerRef})
  vc!: ViewContainerRef;
  private cmpRef!: ComponentRef<any>;

  constructor(private dialog: MatDialog, private _viewContainerRef: ViewContainerRef,
              private compiler: Compiler,
              private injector: Injector,
              private moduleRef: NgModuleRef<any>,
              private route: ActivatedRoute, private router: Router) {
    try {
      this.topic = (+this.route.snapshot.data['topic']);
      this.info = Infos.getInfo(this.topic);
    } catch (exception) {
      this.router.navigateByUrl('');
    }
  }

  openDialog(note?: boolean) {
    if (this.info)
      if(!note) {
        this.dialog.open<CoursComponent, Cours>(CoursComponent, {
          data: {
            nom: this.info.title,
            chapitres: this.info.chapitres
          },
          autoFocus: false
        });
      } else {
        this.dialog.open<NotesComponent, Topic>(NotesComponent, {
          data: this.topic,
          autoFocus: false
        });
      }
  }


  ngAfterViewInit() {
    if (this.vc && this.info?.exemple) this.createComponentFromRaw(this.info.exemple.content, this.info.exemple.default);
  }

  ngOnDestroy() {
    if (this.cmpRef) {
      this.cmpRef.destroy();
    }
  }

  private createComponentFromRaw(template: string, InputValue?: any) {
    const styles: string[] = [`:host {
  width: 100%;
  flex-direction: column
}`];

    const TemplateConstructorFunction = function TmpCmpConstructor(
      this: any
    ): any {
      this.InputValue = InputValue;
      this.toJsonString = () =>  this.afterSubmit = JSON.stringify(this.InputValue);
      this.resetForm = () => {
        this.toJsonString();
        alert("Attention : Valeurs nulles !")
      }
      this.afterSubmit = this.toJsonString();
      this.behaviorSubject = new BehaviorSubject<number>(0)
      this.behaviorSubject.subscribe({
        next: (newValue: number) => console.log('Nouvelle valeur : ' + newValue),
        error: (cause: string) => alert("Cause d'erreur : " + cause),
        complete: () => alert("Observable complété.")
      })
    };
    const tmpCmp: any = Component({template, styles, host: {'class': 'row'}})(
      new (TemplateConstructorFunction as any)().constructor
    );
    const tmpModule = NgModule({
      imports: [BrowserModule, CommonModule, FormsModule, AppRoutingModule],
      declarations: [tmpCmp],
    })(class {
    });
    this.compiler
      .compileModuleAndAllComponentsAsync(tmpModule)
      .then((factories: { componentFactories: any[] }) => {
        const f = factories.componentFactories[0];
        this.vc.createComponent(f,0);
      });
  }
}

