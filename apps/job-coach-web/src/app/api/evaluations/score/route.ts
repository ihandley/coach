import { evaluationsServer } from "../../../../server/evaluations/server";
import { handleScoreEvaluation } from "./route-impl";

export async function POST(request: Request) {
  return handleScoreEvaluation(request, evaluationsServer);
}
