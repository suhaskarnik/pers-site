server:
	hugo server -D

publish:
	git branch -f main devel
	git push origin main
