SHELL := /bin/bash

.PHONY: build build-rust copy-rust build-all bundle clean watch-front watch-back

build:
	pnpm run build

build-rust:
	cd backend/vn_core && cargo build --release

copy-rust:
	pnpm run copy:rust

build-all:
	pnpm run build:all

bundle:
	pnpm run bundle

clean:
	pnpm run clean

watch-front:
	pnpm run watch:front

watch-back:
	pnpm run watch:back

