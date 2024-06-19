#!/usr/bin/env node

const { Command } = require("commander");

const fs = require("fs-extra");
const path = require("path");

const program = new Command();

program
  .command("generate <type>")
  .option("--title <title>", "Title of the Component")
  .option("--table", "Include Table in the Component")
  .option("--columns <columns>", "Comma-separated list of column names")
  .option("--create", "Include create button in the component")
  .option("--filter", "Include filter button in the component")
  .action((type, option) => {
    if (type === "component") {
      generateComponents(option);
    } else {
      console.error("Unknown type:", type);
    }
  });

program.parse(process.argv);

/**
 *
 * @param {*} param0
 * cd-engine generate component --title "Free Zone" --table --create --filter --form-field --columns "Name, Age, Address"
 */

function generateComponents({ title, table, create, filter, columns }) {
  const componentName = title.replace(/\s+/g, "-").toLowerCase();
  const componentDir = path.join(process.cwd(), componentName);

  if (fs.existsSync(componentDir)) {
    console.error("Component directory already exists:", componentDir);
    process.exit(1);
  }

  fs.ensureDirSync(componentDir);

  const htmlContent = getHTMLContent(title, table, create, filter, columns);
  const tsContent = generateTsContent(componentName);
  const cssContent = "";

  fs.writeFileSync(
    path.join(componentDir, `${componentName}.component.html`),
    htmlContent
  );
  fs.writeFileSync(
    path.join(componentDir, `${componentName}.component.ts`),
    tsContent
  );
  fs.writeFileSync(
    path.join(componentDir, `${componentName}.component.scss`),
    cssContent
  );

  console.log("Component generated successfully:", componentDir);
}

function getHTMLContent(title, table, create, filter, columns) {
  let tableContent = "";
  if (table && columns) {
    const colArray = columns.split(",");
    const dataRows = colArray.map((col) => `${getCell(col)}`).join("\n");

    tableContent = `
      <div class="col-12 cd-table mt-2">
          <div class="table-responsive custom-table-height">
              <table mat-table [dataSource]="dataSource" class="table">
                 ${dataRows}
                  <tr mat-header-row *matHeaderRowDef="displayedColumns;sticky:true" style="background: #e2edeb;"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
          </div>
      </div>`;
  }

  return `
<div class="main-content bg-white">
    <div class="row">
        <div class="col-4 page-title">
            <h3 class="list-title">${title}</h3>
        </div>
        <div class="col-8 text-right">
            ${
              filter
                ? '<button class="cd-btn-round cd-btn-stroked-primary" (click)="onFilter()">Filter</button>'
                : ""
            }
            ${
              create
                ? '<button class="cd-btn-round cd-btn-primary ml-2" (click)="openCreateForm()">Create</button>'
                : ""
            }
        </div>
        ${
          table
            ? `<ng-container *ngIf="resultLength; else noFormFound">
            ${tableContent}
          </ng-container>
          <ng-template #noFormFound>
              <div class="d-flex justify-content-center" style="margin: auto;">No Offers found!</div>
          </ng-template>`
            : ""
        }

    </div>
</div>`;
}

function getCell(colName) {
  return `<ng-container matColumnDef="${colName}">
            <th mat-header-cell *matHeaderCellDef>${colName.trim()}</th>
            <td mat-cell *matCellDef="let element">{{element.${colName.trim()}}}</td>
          </ng-container>`;
}

function generateTsContent(componentName, columns, rows) {
  const colArray = columns ? columns.split(",").map((col) => col.trim()) : [];
  const colDefs = colArray.map((col) => `'${col}'`).join(", ");
  const dataSource = Array(rows)
    .fill(0)
    .map(() => {
      const row = {};
      colArray.forEach((col) => (row[col] = ""));
      return row;
    });

  return `
  import { Component, OnInit } from '@angular/core';

  @Component({
    selector: 'app-${componentName}',
    templateUrl: './${componentName}.component.html',
    styleUrls: ['./${componentName}.component.css']
  })
  export class ${capitalizeFirstLetter(
    componentName
  )}Component implements OnInit {

    dataSource = ${JSON.stringify(dataSource, null, 2)};
    displayedColumns: string[] = [${colDefs}];
    resultLength = ${rows || 0};

    constructor() { }

    ngOnInit(): void {
    }

    onFilter(): void {
      // Implement filter logic
    }

    openCreateForm(): void {
      // Implement create form logic
    }
  `;
}

function capitalizeFirstLetter(string) {
  const str = string.split("-").join("");
  return str.charAt(0).toUpperCase() + str.slice(1);
}
