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

prod: clean
	@${NODE_BIN}/browserify src/index.js | ${NODE_BIN}/uglifyjs > ./public/bundle.js

.PHONY: validate clean link dev less