#
# Vars
#

NODE_BIN = ./node_modules/.bin

#
# Tasks
# 

validate:
	@${NODE_BIN}/standard

clean: 
	@rm public/bundle.js &> /dev/null || true

dev: clean
	@${NODE_BIN}/watchify src/index.js -o ./public/bundle.js



.PHONY: validate clean link dev less