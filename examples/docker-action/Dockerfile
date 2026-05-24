# Docker action image — based on pandoc/latex for Markdown → HTML conversion
FROM pandoc/latex:latest

# The entrypoint script does the actual work
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Arguments come from action.yml → args: (positional)
ENTRYPOINT ["/entrypoint.sh"]
