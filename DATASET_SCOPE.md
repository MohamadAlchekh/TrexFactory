# Dataset Scope

This data pack is curated for two hackathon challenges:

- **What-If Analysis** for MES/OEE: OEE, Availability, Performance, Quality, financial impact.
- **Root Cause Analysis** for machine monitoring: alarms, stops, raw telemetry, and event timelines.

The root folder contains the tables teams should load first. Original dump tables that are empty, redundant, snapshots only, or not needed for the core scenarios are preserved in `archive_unused_tables/`.

Teams do **not** have to restore the data into PostgreSQL or TimescaleDB. The curated CSV files can be used directly with notebooks, scripts, DuckDB, SQLite, Pandas, Polars, Spark, BI tools, or any other database. PostgreSQL / TimescaleDB is only one supported option for teams that prefer SQL and time-series indexing.

---

## Main Dataset

Use these logical CSV tables for the hackathon by default. Large Nightwatch tables are split into numbered part files to stay under GitHub's 100 MB file limit; load all parts with the same prefix as one table.

| CSV | Why it is included |
|-----|--------------------|
| `trex_mes_unit.csv` | MES machine/work-center master data |
| `trex_mes_device.csv` | Device and collector context for machines |
| `trex_mes_reading_def.csv` | MES signal definitions: stop, count, stock, alert signals |
| `trex_mes_oee_summary.csv` | Pre-computed OEE, A, P, Q baselines |
| `trex_mes_stoppage_slice.csv` | Downtime events with durations; primary Availability input |
| `trex_mes_stoppage_def.csv` | Manual stoppage reason lookup |
| `trex_mes_counter_slice.csv` | Production count increments; throughput and Performance input |
| `trex_mes_workorder.csv` | Stock/program intervals and cycle-time context |
| `trex_mes_alert.csv` | Parsed CNC alarm events; best RCA entry point |
| `trex_mes_status.csv` | Collector online/offline intervals |
| `trex_nightwatch_unit.csv` | Machine master data for monitoring domain |
| `trex_nightwatch_reading_def.csv` | Monitoring signal definitions and metadata |
| `trex_nightwatch_data_*.csv` | Numeric machine telemetry for RCA |
| `trex_nightwatch_data_string_*.csv` | String telemetry such as program names and alarm text |

This set is enough to build:

- OEE baseline dashboards.
- Downtime reduction What-If scenarios.
- Cycle-time and throughput scenarios.
- Simulated quality/scrap scenarios.
- Financial impact models.
- RCA timelines around alarms and stops.
- Alarm/stop Pareto analysis.

---

## Archived Tables

The following files are kept in `archive_unused_tables/` for completeness, but they are not required for the main hackathon path.

### Empty Or Header-Only Tables

These tables contain no data rows in this dump:

| CSV | Reason archived |
|-----|-----------------|
| `trex_mes_kpi_target.csv` | No target rows |
| `trex_mes_shift_scheduler.csv` | No shift schedule rows |
| `trex_mes_unit_consts.csv` | No unit constants |
| `trex_mes_test_prod.csv` | No test-production rows |
| `trex_mes_production_data.csv` | No ERP/production export rows |
| `trex_mes_personel_slice.csv` | No personnel assignment rows |
| `trex_mes_personel_def.csv` | No personnel master rows |
| `trex_mes_scrap_def.csv` | No scrap definitions |
| `trex_nightwatch_kpi_target.csv` | No target rows |
| `trex_nightwatch_shift_scheduler.csv` | No shift schedule rows |
| `trex_nightwatch_unit_consts.csv` | No unit constants |
| `trex_nightwatch_workorder.csv` | No monitoring work-order rows |
| `trex_nightwatch_data_alert.csv` | No alert-threshold rows |
| `trex_nightwatch_data_datetime.csv` | No datetime telemetry rows |
| `trex_nightwatch_data_guid.csv` | No GUID telemetry rows |
| `trex_nightwatch_numeric_aggregation_data.csv` | No numeric aggregate rows |
| `trex_nightwatch_numeric_aggregation_hist.csv` | No numeric aggregate history rows |
| `trex_nightwatch_numeric_shift_agg_data.csv` | No shift aggregate rows |
| `trex_nightwatch_numeric_shift_agg_history.csv` | No shift aggregate history rows |

### Redundant Or Non-Core Tables

These tables have data, but they are not needed for the core scenarios:

| CSV | Reason archived |
|-----|-----------------|
| `trex_mes_stoppage.csv` | Redundant with `trex_mes_stoppage_slice.csv`; slice table includes `duration_milliseconds` |
| `trex_mes_counter_status.csv` | Latest counter snapshot only; not a historical analysis table |
| `trex_mes_config.csv` | Collector configuration metadata; useful only for advanced schema exploration |
| `trex_mes_config_item_ref.csv` | Internal config hierarchy; not needed when using unit/device/reading_def tables |
| `trex_mes_equipment_def.csv` | Minimal test equipment records |
| `trex_mes_equipment_slice.csv` | One equipment slice record; not useful for scenarios |
| `trex_nightwatch_config.csv` | Collector configuration metadata |
| `trex_nightwatch_device.csv` | Device metadata; optional, but MES device context is enough for the main path |
| `trex_nightwatch_config_item_ref.csv` | Internal config hierarchy |
| `trex_nightwatch_data_status.csv` | Latest signal status snapshots; not historical RCA input |

---

## Loading Recommendation

Start with the root CSVs for the 14 logical tables. Add archived tables only if a team explicitly needs advanced metadata or wants to explore the original dump structure.

Recommended challenge load/import order:

1. `trex_mes_unit.csv`
2. `trex_mes_device.csv`
3. `trex_mes_reading_def.csv`
4. `trex_mes_oee_summary.csv`
5. `trex_mes_stoppage_def.csv`
6. `trex_mes_stoppage_slice.csv`
7. `trex_mes_counter_slice.csv`
8. `trex_mes_workorder.csv`
9. `trex_mes_alert.csv`
10. `trex_mes_status.csv`
11. `trex_nightwatch_unit.csv`
12. `trex_nightwatch_reading_def.csv`
13. `trex_nightwatch_data_001.csv` ... `trex_nightwatch_data_019.csv`
14. `trex_nightwatch_data_string_001.csv` ... `trex_nightwatch_data_string_005.csv`

For performance, always time-filter `trex_nightwatch_data_*.csv` and `trex_nightwatch_data_string_*.csv`; these are the largest logical tables.
