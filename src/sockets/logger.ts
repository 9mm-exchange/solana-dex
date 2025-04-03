import winston from "winston";
const { createLogger, format, transports } = winston;
const { combine, printf } = format;

const LOG_LEVEL = "info";

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${level}][${timestamp}][API] ${message}`;
});

export const logger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    format.splat(), // Ensure splat resolves placeholders properly.
    format.prettyPrint(), // Pretty-print should come afterwards.
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [new transports.Console({})],
});

global.logger = logger;

export function showErrorLogOnly() {
  logger.level = "error";
}