#!/bin/sh
set -eu

# Reproduce the primary-data extraction used for nutrition-foods.json.
# Requirements: curl, shasum, unzip, jq. Output is raw selected USDA data on stdout.

archive_url='https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip'
expected_sha='0fe8ae486a2c8eb42cb96413f058deb51863a46c8fb8eeb4b1fb45006dd338ef'
work_dir=$(mktemp -d)
archive_path="$work_dir/sr-legacy.zip"
trap 'rm -rf "$work_dir"' EXIT HUP INT TERM

curl --fail --location --silent --show-error "$archive_url" --output "$archive_path"
actual_sha=$(shasum -a 256 "$archive_path" | awk '{print $1}')
if [ "$actual_sha" != "$expected_sha" ]; then
  printf 'archive checksum mismatch: expected %s, got %s\n' "$expected_sha" "$actual_sha" >&2
  exit 1
fi

unzip -p "$archive_path" | jq '
  [168191,168878,170567,171265,171284,171413,171477,172421,172454,173424,173757,173905,173944,174915,175168] as $ids
  | [.SRLegacyFoods[]
      | select(.fdcId as $id | $ids | index($id))
      | {
          fdcId,
          description,
          dataType,
          publicationDate,
          nutrients: {
            kcal: (.foodNutrients[] | select(.nutrient.id == 1008) | {fdcNutrientId: .nutrient.id, name: .nutrient.name, unit: .nutrient.unitName, amount}),
            protein_g: (.foodNutrients[] | select(.nutrient.id == 1003) | {fdcNutrientId: .nutrient.id, name: .nutrient.name, unit: .nutrient.unitName, amount}),
            carb_g: (.foodNutrients[] | select(.nutrient.id == 1005) | {fdcNutrientId: .nutrient.id, name: .nutrient.name, unit: .nutrient.unitName, amount}),
            fat_g: (.foodNutrients[] | select(.nutrient.id == 1004) | {fdcNutrientId: .nutrient.id, name: .nutrient.name, unit: .nutrient.unitName, amount})
          },
          foodPortions: [.foodPortions[] | {amount, measureUnit: .measureUnit.name, modifier, gramWeight}]
        }]
  | sort_by(.fdcId)
'
