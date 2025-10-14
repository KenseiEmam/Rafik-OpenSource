import {  ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

//  Setup response structure
const ResponseFormatter =   z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .describe("Standardized food name (prefer USDA name if available)"),
  calories: z
    .number()
    .nonnegative()
    .describe("Total calories in the given quantity"),
  protein: z
    .number()
    .nonnegative()
    .describe("Protein content in grams"),
  carbohydrates: z
    .number()
    .nonnegative()
    .describe("Carbohydrate content in grams"),
  fats: z
    .number()
    .nonnegative()
    .describe("Fat content in grams"),
  quantity: z
    .number()
    .positive()
    .describe("Numeric quantity of the food item"),
  unit: z
    .string()
    .min(1, "Unit is required")
    .describe("Measurement unit (e.g., g, cup, slice, sandwich)"),
  USDA: z
    .boolean()
    .describe("True if data comes from USDA FoodData Central, otherwise false"),
});
export const getFoodResponse = async (
 query:string,
): Promise<{ answer: string; context: any[] }> => {
 
  try {

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      apiKey: Deno.env.OPENAI_API_KEY,
      callbacks: [
        {
          handleLLMEnd(output:any) {
            if (!output.generations?.[0]?.[0]?.text) {
              console.error("generation doesn't exist or doesn't have a text");
              return;
            }
          },
          handleLLMError(error:any) {
            console.error(
              "An error occurred with LLM invoke",
              error.message || error
            );
          },
        },
      ],
    });
    const modelWithStructure = model.withStructuredOutput(ResponseFormatter);
    let systemMessage =
      `You are a chatbot that estimates the nutritional values of a user’s meal or ingredient. 

            The user will provide a food name and a quantity (either structured or natural language). You must return a JSON object with the following fields:

            - "name": standardized food name (prefer USDA name if available)
            - "calories": number
            - "protein": number (grams)
            - "carbohydrates": number (grams)
            - "fats": number (grams)
            - "quantity": numeric value
            - "unit": unit string (e.g., g, cup, slice, sandwich)
            - "USDA": true if the data comes from USDA FoodData Central, otherwise false

            Rules:
            - Always use valid JSON with double quotes for keys and string values.
            - If the food exists in USDA FoodData Central, use its official name and mark USDA:true.
            - If not, provide your best estimate and mark USDA:false.
            - If the input is unrelated to food or quantity, return: {"error": "Please enter valid food name and quantity for tracking."}

            Examples:

            Input: "name: Chicken Shawarma quantity: big sandwich"
            Output:
            {
            "name": "Chicken Shawarma Sandwich",
            "calories": 700,
            "protein": 40,
            "carbohydrates": 70,
            "fats": 30,
            "quantity": 1,
            "unit": "big sandwich",
            "USDA": false
            }

            Input: "name: Chicken Breast Cooked quantity: 200g"
            Output:
            {
            "name": "Chicken, broilers or fryers, breast, skinless, boneless, meat only, cooked, braised",
            "calories": 316,
            "protein": 64.2,
            "carbohydrates": 0,
            "fats": 6.4,
            "quantity": 200,
            "unit": "g",
            "USDA": true
            }
      ` ;
    



    const response = await modelWithStructure.invoke([
       {
            role: "system",
            content:systemMessage,
        },
        {
            role: "user",
            content: query,
        }
    ]);

    return { answer: response, context: [] };
  } catch (e) {
    console.error(e);
    const answer =
      "Sorry, I am not able to answer that right now. Please try again later.\n" ;
    return {
      answer,
      context: [],
    };
  }
};
