import { BadRequestException } from "@nestjs/common";
import type { ValidationError } from "class-validator";

/** Ordre de priorité quand un champ enfreint plusieurs règles : la plus parlante d'abord. */
const PRIORITY = ["isDefined", "isNotEmpty", "isString", "isInt", "isNumber", "isBoolean", "isArray", "isEmail", "isDateString"];

function pickMessage(constraints: Record<string, string>): string {
  const key = PRIORITY.find((k) => k in constraints) ?? Object.keys(constraints)[0];
  return constraints[key];
}

/**
 * Transforme les erreurs de class-validator en une liste de messages lisibles :
 * un seul message par champ, et « Tableau 2 : … » au lieu de « tables.1. … » pour les listes.
 */
function flatten(errors: ValidationError[], prefix = ""): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) messages.push(prefix + pickMessage(error.constraints));
    if (error.children?.length) {
      for (const child of error.children) {
        const index = Number(child.property);
        // Élément d'une liste (ex. tables[1]) : on numérote à partir de 1
        const childPrefix = Number.isInteger(index) ? `${prefix}Tableau ${index + 1} : ` : prefix;
        messages.push(...flatten(child.children?.length ? child.children : [child], childPrefix));
      }
    }
  }
  return messages;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException(flatten(errors));
}
