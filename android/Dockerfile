FROM mingc/android-build-box:latest as builder

WORKDIR /build

COPY . /build

RUN --mount=type=cache,sharing=locked,target=/root/.gradle \
    --mount=type=cache,sharing=locked,target=/build/.gradle \
    --mount=type=cache,sharing=locked,target=/build/app/build \
    ./gradlew --build-cache --parallel build

#RUN --mount=type=cache,sharing=locked,target=/root/.gradle \
#    --mount=type=cache,sharing=locked,target=/build/.gradle \
#    --mount=type=cache,sharing=locked,target=/build/app/build \
#     find / -type f -name "*.apk"
#
#RUN --mount=type=cache,sharing=locked,target=/root/.gradle \
#    --mount=type=cache,sharing=locked,target=/build/.gradle \
#    --mount=type=cache,sharing=locked,target=/build/app/build \
#    ls -a1l /build/app/build/outputs/apk/*

RUN --mount=type=cache,sharing=locked,target=/root/.gradle \
    --mount=type=cache,sharing=locked,target=/build/.gradle \
    --mount=type=cache,sharing=locked,target=/build/app/build \
    cp -R /build/app/build/outputs/apk/ /


FROM python:alpine3.17 as uploader

WORKDIR /opt

RUN apk add --no-cache git
RUN pip install --upgrade pip
RUN pip install python-dateutil

RUN git clone https://github.com/abbat/ydcmd.git

WORKDIR /upload

ARG YA_DISK_TOKEN
ENV YA_DISK_TOKEN=${YA_DISK_TOKEN}

COPY ./upload.sh .

COPY --from=builder /apk/debug/app-debug.apk .
COPY --from=builder /apk/release/app-release-unsigned.apk .

RUN ls -1al .

RUN /upload/upload.sh

CMD [ "/upload/upload.sh" ]

