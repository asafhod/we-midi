// helper function which formats url query arguments into arrays Mongoose can use to query the db
export const formatQueryArray = (data: string): RegExp[] => {
  // split query argument string into array
  const queryArray: string[] = data.split(",");

  // map each entry to a RegExp with the "i" flag to allow for case-insensitive querying
  const queryRegExpArray: RegExp[] = queryArray.map((entry: string) => RegExp(`^${entry}$`, "i"));

  return queryRegExpArray;
};
