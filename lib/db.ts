import { DataSource } from "typeorm";
import { AppDataSource } from "./data-source";

let dataSource: DataSource | null = null;
let initPromise: Promise<DataSource> | null = null;

export async function getDB(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }
  if (!initPromise) {
    initPromise = AppDataSource.initialize().then((ds) => {
      dataSource = ds;
      return ds;
    });
  }
  return initPromise;
}
