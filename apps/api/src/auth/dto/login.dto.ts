import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @IsString({ message: "L'identifiant doit être un texte" })
  @IsNotEmpty({ message: "L'identifiant est obligatoire" })
  @MaxLength(191)
  identifier!: string;

  @IsString({ message: "Le mot de passe doit être un texte" })
  @IsNotEmpty({ message: "Le mot de passe est obligatoire" })
  @MaxLength(255)
  password!: string;
}
