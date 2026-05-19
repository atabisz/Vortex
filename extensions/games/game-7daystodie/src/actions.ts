<<<<<<< HEAD
import { createAction } from "redux-act";

import { LoadOrder } from "./types";

export const setPrefixOffset = createAction(
  "7DTD_SET_PREFIX_OFFSET",
  (profile: string, offset: number) => ({ profile, offset }),
);

export const setUDF = createAction("7DTD_SET_UDF", (udf: string) => ({ udf }));

=======
import { LoadOrder } from "./types";
import { createAction } from "redux-act";

export const setPrefixOffset = createAction(
  "7DTD_SET_PREFIX_OFFSET",
  (profile: string, offset: number) => ({ profile, offset }),
);

export const setUDF = createAction("7DTD_SET_UDF", (udf: string) => ({ udf }));

>>>>>>> v2.0.1
export const setPreviousLO = createAction(
  "7DTD_SET_PREVIOUS_LO",
  (profile: string, previousLO: LoadOrder) => ({ profile, previousLO }),
);
