FROM python:3.9

WORKDIR /app

COPY requirements.txt /app
# RUN --mount=type=cache,target=/root/.cache/pip \
#     pip3 install -r requirements.txt

COPY . /app

RUN pip3 install -r requirements.txt

EXPOSE 5000

ENTRYPOINT ["python3"]
CMD ["app.py"]

