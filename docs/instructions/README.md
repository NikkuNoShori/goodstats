# Instructions Documentation

This directory contains all instruction sets for the GoodStats application. The structure is organized as follows:

## Directory Structure

- `current.md` - The current active instruction set being worked on
- `template.md` - The base template for creating new instruction sets
- `archive/` - Historical instruction sets, archived by date and feature

## Usage

1. When starting a new feature or bug fix:
   - Copy `template.md` to `current.md`
   - Fill in the template with your current task details

2. When completing a feature:
   - Move `current.md` to `archive/YYYY-MM-DD_feature-name.md`
   - Include any relevant notes or outcomes in the archived file

3. For referencing past work:
   - Check the `archive/` directory for historical context
   - Each archived file includes the original instructions and outcomes

## Naming Convention

Archived files should follow this format:
`YYYY-MM-DD_feature-name.md`

Example:
`2024-01-02_remove-magic-link.md` 