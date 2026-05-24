# deploy.R - Script deploy otomatis

cat("🚀 Starting portfolio deployment process...\n")

# ============================================
# STEP 1: Render semua R Markdown
# ============================================
cat("\n📊 Rendering R Markdown files...\n")

rmd_files <- list.files(pattern = "\\.Rmd$", recursive = TRUE)

if (length(rmd_files) > 0) {
  for (file in rmd_files) {
    cat("  Rendering:", file, "\n")
    rmarkdown::render(file, quiet = TRUE)
  }
  cat("✅ R Markdown rendered successfully\n")
} else {
  cat("ℹ️ No Rmd files found\n")
}

# ============================================
# STEP 2: Check file integrity
# ============================================
cat("\n🔍 Checking file integrity...\n")

required_files <- c("index.html", "css/style.css", "js/main.js")
missing_files <- required_files[!file.exists(required_files)]

if (length(missing_files) > 0) {
  cat("❌ Missing files:", paste(missing_files, collapse=", "), "\n")
} else {
  cat("✅ All required files present\n")
}

# ============================================
# STEP 3: Git commands (opsional)
# ============================================
cat("\n📦 Ready to deploy to GitHub Pages\n")
cat("Run these commands in terminal:\n")
cat("  git add .\n")
cat("  git commit -m 'Update portfolio'\n")
cat("  git push origin main\n")

cat("\n✅ Deployment preparation complete!\n")