import { IsEmail, MaxLength } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
