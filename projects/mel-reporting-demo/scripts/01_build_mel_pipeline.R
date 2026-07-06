# MEL reporting automation template for conservation programs
# Assumes you run the script from the "projects/mel-reporting-demo" directory.

rm(list = ls())
cat("\f")

required_packages <- c(
  "dplyr",
  "tidyr",
  "readr",
  "stringr",
  "lubridate",
  "janitor",
  "ggplot2",
  "glue",
  "scales"
)

missing_packages <- required_packages[!(required_packages %in% installed.packages()[, "Package"])]
if (length(missing_packages) > 0) {
  install.packages(missing_packages, repos = "https://cloud.r-project.org")
}

invisible(lapply(required_packages, library, character.only = TRUE))

reporting_period_selected <- "2026-Q1"
priority_sites <- c("Block A", "Block B", "Block C")

ensure_directories <- function(paths) {
  invisible(lapply(paths, dir.create, recursive = TRUE, showWarnings = FALSE))
}

ensure_directories(c(
  "data-processed",
  "outputs",
  "outputs/figures",
  "outputs/tables",
  "outputs/narrative"
))

input_file <- "data-raw/mel_indicator_data.csv"
template_file <- "data-raw/mel_indicator_data_template.csv"

if (!file.exists(input_file) && file.exists(template_file)) {
  file.copy(template_file, input_file)
  message("No input file found. Copied template data to: ", input_file)
}

if (!file.exists(input_file)) {
  stop("Input file not found. Place your MEL data in data-raw/mel_indicator_data.csv")
}

mel_raw <- read_csv(input_file, show_col_types = FALSE) |>
  clean_names()

required_columns <- c(
  "reporting_period",
  "observation_date",
  "site",
  "indicator",
  "result_level",
  "unit",
  "value",
  "target",
  "source",
  "qa_status"
)

missing_columns <- setdiff(required_columns, names(mel_raw))
if (length(missing_columns) > 0) {
  stop(glue("Missing required columns: {toString(missing_columns)}"))
}

mel_clean <- mel_raw |>
  mutate(
    observation_date = ymd(observation_date),
    reporting_period = str_trim(reporting_period),
    site = str_squish(site),
    indicator = str_to_lower(str_replace_all(indicator, " ", "_")),
    result_level = str_to_lower(result_level),
    unit = str_to_lower(unit),
    source = str_squish(source),
    qa_status = str_to_lower(qa_status),
    value = as.numeric(value),
    target = as.numeric(target)
  )

qa_missing_core <- mel_clean |>
  filter(
    is.na(reporting_period) |
      is.na(observation_date) |
      is.na(site) |
      is.na(indicator) |
      is.na(value)
  ) |>
  mutate(issue_type = "missing_core_fields")

qa_invalid_status <- mel_clean |>
  filter(!qa_status %in% c("verified", "provisional", "rejected")) |>
  mutate(issue_type = "invalid_qa_status")

qa_duplicate_rows <- mel_clean |>
  count(reporting_period, site, indicator, observation_date, name = "n") |>
  filter(n > 1) |>
  mutate(issue_type = "possible_duplicate")

qa_negative_values <- mel_clean |>
  filter(value < 0) |>
  mutate(issue_type = "negative_value")

qa_priority_sites_missing <- tidyr::crossing(
  reporting_period = reporting_period_selected,
  site = priority_sites
) |>
  anti_join(
    mel_clean |>
      filter(reporting_period == reporting_period_selected) |>
      distinct(reporting_period, site),
    by = c("reporting_period", "site")
  ) |>
  mutate(issue_type = "missing_priority_site_data")

qa_summary <- bind_rows(
  qa_missing_core |>
    select(any_of(required_columns), issue_type),
  qa_invalid_status |>
    select(any_of(required_columns), issue_type),
  qa_negative_values |>
    select(any_of(required_columns), issue_type),
  qa_duplicate_rows,
  qa_priority_sites_missing
) |>
  mutate(review_flag = "check")

write_csv(qa_summary, "outputs/tables/qa_issues.csv")

mel_verified <- mel_clean |>
  filter(qa_status == "verified")

indicator_summary <- mel_verified |>
  group_by(reporting_period, site, indicator, result_level, unit) |>
  summarise(
    value = sum(value, na.rm = TRUE),
    target = if (all(is.na(target))) NA_real_ else max(target, na.rm = TRUE),
    .groups = "drop"
  ) |>
  mutate(
    performance_ratio = if_else(!is.na(target) & target != 0, value / target, NA_real_),
    performance_status = case_when(
      is.na(performance_ratio) ~ "no_target",
      performance_ratio >= 1 ~ "on_track",
      performance_ratio >= 0.8 ~ "watch",
      TRUE ~ "off_track"
    )
  )

write_csv(indicator_summary, "data-processed/indicator_summary.csv")

period_overview <- indicator_summary |>
  filter(reporting_period == reporting_period_selected) |>
  summarise(
    indicators_reported = n_distinct(indicator),
    sites_reported = n_distinct(site),
    on_track_count = sum(performance_status == "on_track", na.rm = TRUE),
    watch_count = sum(performance_status == "watch", na.rm = TRUE),
    off_track_count = sum(performance_status == "off_track", na.rm = TRUE)
  )

site_scorecard <- indicator_summary |>
  filter(reporting_period == reporting_period_selected) |>
  group_by(site) |>
  summarise(
    indicators_reported = n(),
    pct_on_track = mean(performance_status == "on_track", na.rm = TRUE),
    pct_off_track = mean(performance_status == "off_track", na.rm = TRUE),
    .groups = "drop"
  ) |>
  arrange(desc(pct_off_track))

write_csv(site_scorecard, "outputs/tables/site_scorecard.csv")

priority_indicator_table <- indicator_summary |>
  filter(
    reporting_period == reporting_period_selected,
    indicator %in% c(
      "patrol_days",
      "patrol_coverage",
      "threat_incidents",
      "community_meetings"
    )
  ) |>
  arrange(indicator, site)

write_csv(priority_indicator_table, "outputs/tables/priority_indicator_table.csv")

trend_data <- indicator_summary |>
  filter(indicator %in% c("patrol_coverage", "threat_incidents"))

if (nrow(trend_data) > 0) {
  p_trend <- ggplot(
    trend_data,
    aes(x = reporting_period, y = value, group = site, color = site)
  ) +
    geom_line(linewidth = 1) +
    geom_point(size = 2) +
    facet_wrap(~ indicator, scales = "free_y") +
    scale_color_brewer(palette = "Set2") +
    labs(
      title = "Selected MEL Indicator Trends",
      x = "Reporting period",
      y = "Indicator value",
      color = "Site"
    ) +
    theme_minimal(base_size = 11) +
    theme(
      legend.position = "bottom",
      panel.grid.minor = element_blank()
    )

  ggsave(
    filename = "outputs/figures/indicator_trends.png",
    plot = p_trend,
    width = 10,
    height = 6,
    dpi = 300
  )
}

status_counts <- indicator_summary |>
  filter(reporting_period == reporting_period_selected) |>
  count(performance_status)

if (nrow(status_counts) > 0) {
  p_status <- ggplot(status_counts, aes(x = performance_status, y = n, fill = performance_status)) +
    geom_col(width = 0.7) +
    scale_fill_manual(
      values = c(
        on_track = "#2c6e49",
        watch = "#d9a441",
        off_track = "#b94a48",
        no_target = "#58748b"
      )
    ) +
    labs(
      title = "Indicator performance status",
      x = NULL,
      y = "Number of indicator-site combinations"
    ) +
    theme_minimal(base_size = 11) +
    theme(legend.position = "none")

  ggsave(
    filename = "outputs/figures/performance_status.png",
    plot = p_status,
    width = 8,
    height = 5,
    dpi = 300
  )
}

top_messages <- indicator_summary |>
  filter(reporting_period == reporting_period_selected) |>
  mutate(gap_to_target = target - value) |>
  arrange(desc(gap_to_target)) |>
  slice_head(n = 3) |>
  transmute(
    message = glue(
      "{site}: {indicator} reached {round(value, 2)} against a target of {round(target, 2)} ",
      "({performance_status})."
    )
  )

headline_text <- glue(
  "{period_overview$indicators_reported} indicators were reported across ",
  "{period_overview$sites_reported} sites in {reporting_period_selected}. ",
  "{period_overview$on_track_count} indicator-site results were on track, ",
  "{period_overview$watch_count} were in a watch zone, and ",
  "{period_overview$off_track_count} were off track."
)

priority_sites_text <- if (nrow(site_scorecard) > 0) {
  toString(site_scorecard$site[1:min(3, nrow(site_scorecard))])
} else {
  "none identified"
}

management_note <- glue(
  "Sites with the highest share of off-track indicators were: {priority_sites_text}. ",
  "These sites should be prioritized for a management review."
)

narrative_lines <- c(
  glue("Quarterly MEL summary for {reporting_period_selected}"),
  headline_text,
  management_note,
  "Priority findings:"
)

if (nrow(top_messages) > 0) {
  narrative_lines <- c(narrative_lines, paste0("- ", top_messages$message))
}

write_lines(narrative_lines, "outputs/narrative/quarterly_summary.txt")
write_csv(period_overview, "outputs/tables/period_overview.csv")

message(glue("Pipeline completed for {reporting_period_selected}"))
