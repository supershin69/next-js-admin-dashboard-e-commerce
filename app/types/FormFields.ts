import z from "zod";
import { authSchema } from "../zodschema/authSchema";

export type FormFields = z.infer<typeof authSchema>