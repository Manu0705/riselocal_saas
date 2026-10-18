CREATE TABLE "HostelAdmissionNumberCounter" (
    "tenantId" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HostelAdmissionNumberCounter_pkey"
        PRIMARY KEY ("tenantId", "admissionYear"),
    CONSTRAINT "HostelAdmissionNumberCounter_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

WITH existing_numbers AS (
    SELECT
        "tenantId",
        regexp_match("admissionNumber", '^ADM-([0-9]{4})-([0-9]{5})$') AS parts
    FROM "Student"
), yearly_maxima AS (
    SELECT
        "tenantId",
        (parts[1])::INTEGER AS "admissionYear",
        MAX((parts[2])::INTEGER) AS "lastValue"
    FROM existing_numbers
    WHERE parts IS NOT NULL
    GROUP BY "tenantId", (parts[1])::INTEGER
)
INSERT INTO "HostelAdmissionNumberCounter" ("tenantId", "admissionYear", "lastValue")
SELECT "tenantId", "admissionYear", "lastValue"
FROM yearly_maxima;
